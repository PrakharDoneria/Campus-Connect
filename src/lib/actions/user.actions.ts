
'use server';

import clientPromise from '@/lib/mongodb';
import { IMessage, IUser, Gender } from '@/types';
import { Collection, ObjectId } from 'mongodb';
import { joinCircle } from './circle.actions';
import { auth } from '@/lib/firebase';
import { deleteUser as deleteFirebaseUser } from 'firebase/auth';
import { sendPushNotification } from './notification.actions';

async function getDb() {
    const client = await clientPromise;
    return client.db();
}

async function getUsersCollection(): Promise<Collection<IUser>> {
  const db = await getDb();
  // Ensure the 2dsphere index exists
  try {
    await db.collection<IUser>('users').createIndex({ location: '2dsphere' });
  } catch (e) {
    console.warn("Could not create 2dsphere index on users collection. This is expected if it already exists.");
  }
  // Ensure index on uid for faster lookups
  try {
      await db.collection<IUser>('users').createIndex({ uid: 1 }, { unique: true });
  } catch (e) {
      console.warn("Could not create unique index on users collection uid. This is expected if it already exists.");
  }
    // Ensure text index for searching
  try {
      await db.collection<IUser>('users').createIndex({ name: "text" });
  } catch(e) {
       console.warn("Could not create text index on users collection name. This is expected if it already exists.");
  }
   try {
      await db.collection<IUser>('users').createIndex({ university: 1 });
  } catch(e) {
      console.warn("Could not create index on university. This is expected if it already exists.");
  }
  return db.collection<IUser>('users');
}


export async function getUser(uid: string): Promise<IUser | null> {
  const usersCollection = await getUsersCollection();
  // Ensure we are querying with a valid string UID, not an ObjectId string
  if (ObjectId.isValid(uid)) {
    const userById = await getUserById(uid);
    if(userById) return userById;
  }
  
  const user = await usersCollection.findOne({ uid });

  if (!user) {
    return null;
  }
  // Convert _id to string for serialization
  return { ...user, _id: user._id.toString() } as unknown as IUser;
}

export async function getUserById(id: string): Promise<IUser | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ _id: new ObjectId(id) });
  if (!user) {
    return null;
  }
  return { ...user, _id: user._id.toString() } as unknown as IUser;
}


export async function createUser(user: Partial<IUser>): Promise<IUser> {
  const usersCollection = await getUsersCollection();
  
  const existingUser = await usersCollection.findOne({ uid: user.uid });
    if (existingUser) {
        return { ...existingUser, _id: existingUser._id.toString() } as unknown as IUser;
    }

  const newUserPayload: Omit<IUser, '_id'> = {
    uid: user.uid!,
    email: user.email!,
    name: user.name!,
    photoUrl: user.photoUrl,
    friends: [],
    friendRequestsSent: [],
    friendRequestsReceived: [],
    blockedUsers: [],
    joinedCircles: ['general'], // Automatically join 'general'
    socials: {},
    ...user,
  };

  const result = await usersCollection.insertOne(newUserPayload as any);
  const newUser = await usersCollection.findOne({ _id: result.insertedId });
  if (!newUser) {
    throw new Error('Failed to create user.');
  }
  
  return { ...newUser, _id: newUser._id.toString() } as unknown as IUser;
}

export async function updateUser(uid: string, data: Partial<IUser>): Promise<IUser | null> {
    const usersCollection = await getUsersCollection();
    
    // Ensure `location` is properly formatted if present
    if (data.location && typeof data.location.coordinates[0] === 'string') {
      data.location.coordinates = [
        parseFloat(data.location.coordinates[0]),
        parseFloat(data.location.coordinates[1]),
      ];
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { uid },
      { $set: data },
      { returnDocument: 'after' }
    );
  
    if (!result) {
      return null;
    }
  
    return { ...result, _id: result._id.toString() } as unknown as IUser;
}

export async function getNearbyUsers({
  userId,
  lat,
  long,
  maxDistance = 50000, // 50km
  limit = 20,
}: {
  userId: string;
  lat: number;
  long: number;
  maxDistance?: number;
  limit?: number;
}): Promise<IUser[]> {
  const usersCollection = await getUsersCollection();
  const currentUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
  
  const users = await usersCollection.find({
    _id: { $ne: new ObjectId(userId) }, // Exclude the current user
    uid: { $nin: currentUser?.friends || [] }, // Exclude friends
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [long, lat]
        },
        $maxDistance: maxDistance
      }
    }
  }).limit(limit).toArray();

  return users.map(user => ({
    ...user,
    _id: user._id.toString(),
  })) as IUser[];
}

export async function getRandomUsers({
    currentUserId,
    preference,
    limit = 20
}: {
    currentUserId: string;
    preference: Gender | 'everyone';
    limit?: number;
}): Promise<IUser[]> {
    const usersCollection = await getUsersCollection();
    const currentUser = await usersCollection.findOne({ _id: new ObjectId(currentUserId) });
    
    const pipeline: any[] = [
        // Exclude the current user, their friends, and any users they have blocked or have blocked them
        { $match: { 
            _id: { $ne: new ObjectId(currentUserId) },
            uid: { $nin: [...(currentUser?.friends || []), ...(currentUser?.friendRequestsSent || [])] }
        }},
    ];

    if (preference !== 'everyone') {
        pipeline.push({ $match: { gender: preference } });
    }

    // Add location-based sorting if the current user has a location
    if (currentUser?.location) {
        pipeline.unshift({
            $geoNear: {
                near: currentUser.location,
                distanceField: "dist.calculated",
                spherical: true
            }
        });
    } else {
        // If no location, fall back to random sampling
        pipeline.push({ $sample: { size: limit } });
    }
    
    pipeline.push({ $limit: limit });


    const randomUsers = await usersCollection.aggregate(pipeline).toArray();
    
    return randomUsers.map(user => ({
        ...user,
        _id: user._id.toString(),
    })) as IUser[];
}


export async function sendFriendRequest(fromUid: string, toUid: string): Promise<void> {
  const users = await getUsersCollection();
  const fromUser = await users.findOne({ uid: fromUid });
  const toUser = await users.findOne({ uid: toUid });
  
  if (!fromUser || !toUser) {
    throw new Error("User not found.");
  }
  
  if (fromUid === toUid || fromUser.friends?.includes(toUid)) {
      throw new Error("Invalid friend request.");
  }

  await users.updateOne({ uid: fromUid }, { $addToSet: { friendRequestsSent: toUid } });
  await users.updateOne({ uid: toUid }, { $addToSet: { friendRequestsReceived: fromUid } });

  // Send push notification
  await sendPushNotification({
      userId: toUid,
      title: 'New Friend Request!',
      body: `${fromUser.name} wants to connect with you.`,
      url: '/friends',
  });
}

export async function acceptFriendRequest(userUid: string, fromUid: string): Promise<void> {
  const users = await getUsersCollection();
  // Add to each other's friends list
  await users.updateOne({ uid: userUid }, { $addToSet: { friends: fromUid }, $pull: { friendRequestsReceived: fromUid } });
  await users.updateOne({ uid: fromUid }, { $addToSet: { friends: userUid }, $pull: { friendRequestsSent: userUid } });
}

export async function rejectFriendRequest(userUid: string, fromUid: string): Promise<void> {
  const users = await getUsersCollection();
  // Remove the request
  await users.updateOne({ uid: userUid }, { $pull: { friendRequestsReceived: fromUid } });
  await users.updateOne({ uid: fromUid }, { $pull: { friendRequestsSent: userUid } });
}

export async function removeFriend(userUid: string, friendUid: string): Promise<void> {
    const users = await getUsersCollection();
    // Remove from both users' friends lists
    await users.updateOne({ uid: userUid }, { $pull: { friends: friendUid } });
    await users.updateOne({ uid: friendUid }, { $pull: { friends: userUid } });
}

export async function getUsers(uids: string[]): Promise<IUser[]> {
  if (!uids || uids.length === 0) return [];
  const usersCollection = await getUsersCollection();
  const userObjects = await usersCollection.find({ uid: { $in: uids } }).toArray();
  return userObjects.map(user => ({
    ...user,
    _id: user._id.toString(),
  })) as IUser[];
}

export async function blockUser(blockerUid: string, blockedUid: string): Promise<void> {
    const users = await getUsersCollection();
    if (blockerUid === blockedUid) {
        throw new Error("You cannot block yourself.");
    }

    // Add blocked user to blocker's list
    await users.updateOne({ uid: blockerUid }, { $addToSet: { blockedUsers: blockedUid } });

    // Remove any relationship
    await removeFriend(blockerUid, blockedUid);
    await rejectFriendRequest(blockerUid, blockedUid); // covers requests sent and received
    await rejectFriendRequest(blockedUid, blockerUid);
}

export async function searchUsersByName(query: string, currentUserId: string): Promise<IUser[]> {
    const usersCollection = await getUsersCollection();
    // Use a case-insensitive regex for partial matching
    const users = await usersCollection.find({
        name: { $regex: query, $options: 'i' },
        _id: { $ne: new ObjectId(currentUserId) }
    }).limit(20).toArray();

    return users.map(user => ({
        ...user,
        _id: user._id.toString(),
    })) as IUser[];
}

export async function deleteUserAccount(uid: string): Promise<void> {
  const db = await getDb();
  const usersCollection = db.collection<IUser>('users');
  const postsCollection = db.collection('posts');
  const commentsCollection = db.collection('comments');
  const circlesCollection = db.collection('circles');
  
  const user = await usersCollection.findOne({ uid });
  if (!user) {
    throw new Error('User not found.');
  }

  // Firebase Auth user must be deleted from the client-side, which is handled there.
  // This server action will handle all database cleanup.
  
  const client = await clientPromise;
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      // 1. Delete user's document
      await usersCollection.deleteOne({ uid }, { session });

      // 2. Delete user's posts
      await postsCollection.deleteMany({ 'author.uid': uid }, { session });
      
      // 3. Delete user's comments
      await commentsCollection.deleteMany({ 'author.uid': uid }, { session });
      
      // 4. Delete user's created circles
      await circlesCollection.deleteMany({ creatorUid: uid }, { session });

      // 5. Remove user's likes from all posts
      await postsCollection.updateMany({}, { $pull: { likes: uid } }, { session });

      // 6. Remove user's comments from all posts' comment arrays
      const userCommentIds = await commentsCollection.find({ 'author.uid': uid }).project({ _id: 1 }).toArray();
      const commentIds = userCommentIds.map(c => c._id);
      await postsCollection.updateMany({}, { $pull: { comments: { $in: commentIds } } }, { session });

      // 7. Remove from friends lists and requests of other users
      await usersCollection.updateMany(
        {},
        {
          $pull: {
            friends: uid,
            friendRequestsSent: uid,
            friendRequestsReceived: uid,
            blockedUsers: uid,
          },
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
}


export async function inferUserInteractionPreference(uid: string): Promise<Gender | 'everyone'> {
  const currentUser = await getUser(uid);
  if (!currentUser || !currentUser.friends) return 'everyone';

  // 1. Get friends' details from MongoDB
  const friends = await getUsers(currentUser.friends);

  if (friends.length === 0) {
    return 'everyone';
  }

  // 2. Analyze genders from the friends list
  let maleCount = 0;
  let femaleCount = 0;
  friends.forEach(user => {
    if (user.gender === 'male') maleCount++;
    if (user.gender === 'female') femaleCount++;
  });

  const total = maleCount + femaleCount;
  if (total === 0) return 'everyone';

  const maleRatio = maleCount / total;
  const femaleRatio = femaleCount / total;

  // 3. Determine preference based on a simple majority threshold
  if (maleRatio > 0.7) return 'male';
  if (femaleRatio > 0.7) return 'female';
  
  return 'everyone';
}
