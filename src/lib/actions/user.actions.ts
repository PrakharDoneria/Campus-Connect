'use server';

import clientPromise from '@/lib/mongodb';
import { IUser } from '@/types';
import { Collection } from 'mongodb';

async function getUsersCollection(): Promise<Collection<IUser>> {
  const client = await clientPromise;
  const db = client.db();
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
