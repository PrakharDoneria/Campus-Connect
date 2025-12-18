
'use server';

import clientPromise from '@/lib/mongodb';
import { IMessage, IUser } from '@/types';
import { Collection, ObjectId } from 'mongodb';

async function getUsersCollection(): Promise<Collection<IUser>> {
  const client = await clientPromise;
  const db = client.db();
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
  return db.collection<IUser>('users');
}

async function getMessagesCollection(): Promise<Collection<Omit<IMessage, '_id'>>> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Omit<IMessage, '_id'>>('messages');
}


export async function getUser(uid: string): Promise<IUser | null> {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ uid });
  if (!user) {
    // Fallback for profiles that are referenced by Mongo ID instead of UID
    if (ObjectId.isValid(uid)) {
        const userById = await getUserById(uid);
        return userById;
    }
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
  
  const users = await usersCollection.find({
    _id: { $ne: new ObjectId(userId) }, // Exclude the current user
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

export async function sendFriendRequest(fromUid: string, toUid: string): Promise<void> {
  const users = await getUsersCollection();
  await users.updateOne({ uid: fromUid }, { $addToSet: { friendRequestsSent: toUid } });
  await users.updateOne({ uid: toUid }, { $addToSet: { friendRequestsReceived: fromUid } });
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


export async function sendMessage(fromUid: string, toUid: string, text: string): Promise<IMessage> {
  const messagesCollection = await getMessagesCollection();
  const conversationId = [fromUid, toUid].sort().join('_');
  
  const newMessageData: Omit<IMessage, '_id'> = {
    conversationId,
    from: fromUid,
    to: toUid,
    text,
    createdAt: new Date(),
  };

  const result = await messagesCollection.insertOne(newMessageData);
  
  return {
    ...newMessageData,
    _id: result.insertedId.toString(),
  };
}
