
'use server';

import clientPromise from '@/lib/mongodb';
import { IDoubt, IUser } from '@/types';
import { Collection } from 'mongodb';

async function getDoubtsCollection(): Promise<Collection<Omit<IDoubt, '_id'>>> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Omit<IDoubt, '_id'>>('doubts');
}

export async function createDoubt(
    { title, description, subject }: { title: string; description: string; subject: string; },
    user: IUser
): Promise<IDoubt> {
  const doubtsCollection = await getDoubtsCollection();

  const newDoubtData: Omit<IDoubt, '_id'> = {
    author: {
      uid: user.uid,
      name: user.name,
      avatarUrl: user.photoUrl || '',
      university: user.university || 'N/A',
    },
    title,
    description,
    subject,
    createdAt: new Date(),
    answers: [],
  };

  const result = await doubtsCollection.insertOne(newDoubtData);
  
  if (!result.insertedId) {
      throw new Error("Failed to create doubt.");
  }
  
  const createdDoubt = {
    ...newDoubtData,
    _id: result.insertedId,
  };

  return {
    ...createdDoubt,
    _id: createdDoubt._id.toString(),
  } as IDoubt;
}

export async function getDoubts(): Promise<IDoubt[]> {
    const doubtsCollection = await getDoubtsCollection();
    const doubts = await doubtsCollection.find({}).sort({ createdAt: -1 }).toArray();

    return doubts.map(doubt => ({
        ...doubt,
        _id: doubt._id.toString(),
    })) as IDoubt[];
}
