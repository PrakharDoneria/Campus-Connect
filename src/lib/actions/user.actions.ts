'use server';

import clientPromise from '@/lib/mongodb';
import { IUser } from '@/types';
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
  return db.collection<IUser>('users');
}

export async function getUser(uid: string): Promise<IUser | null> {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ uid });
  if (!user) {
    return null;
  }
  // Convert _id to string for serialization
  return { ...user, _id: user._id.toString() } as unknown as IUser;
}

export async function createUser(user: Omit<IUser, '_id'>): Promise<IUser> {
  const usersCollection = await getUsersCollection();
  const result = await usersCollection.insertOne(user);
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
