
'use server';

import clientPromise from '@/lib/mongodb';
import { ICircle } from '@/types';
import { Collection } from 'mongodb';

async function getCirclesCollection(): Promise<Collection<Omit<ICircle, '_id'>>> {
  const client = await clientPromise;
  const db = client.db();
  // Ensure index on name for faster lookups and uniqueness
  try {
      await db.collection<Omit<ICircle, '_id'>>('circles').createIndex({ name: 1 }, { unique: true });
  } catch (e) {
      console.warn("Could not create unique index on circles collection name. This is expected if it already exists.");
  }
  return db.collection<Omit<ICircle, '_id'>>('circles');
}

export async function createCircle(
    { name, description }: { name: string; description: string },
    creatorUid: string
): Promise<ICircle> {
  const circlesCollection = await getCirclesCollection();

  const existingCircle = await circlesCollection.findOne({ name: name.toLowerCase() });
  if (existingCircle) {
    throw new Error(`Circle "c/${name}" already exists.`);
  }

  const newCircleData: Omit<ICircle, '_id'> = {
    name: name.toLowerCase(),
    description,
    creatorUid,
    createdAt: new Date(),
  };

  const result = await circlesCollection.insertOne(newCircleData);
  
  if (!result.insertedId) {
      throw new Error("Failed to create circle.");
  }
  
  const createdCircle = {
    ...newCircleData,
    _id: result.insertedId,
  };

  return {
    ...createdCircle,
    _id: createdCircle._id.toString(),
  } as ICircle;
}

export async function getCircles(): Promise<ICircle[]> {
    const circlesCollection = await getCirclesCollection();
    const circles = await circlesCollection.find({}).sort({ createdAt: -1 }).toArray();

    // Create a default 'general' circle if none exist
    if (circles.length === 0) {
        try {
            const generalCircle = await createCircle({ name: 'general', description: 'A place for everything.' }, 'system');
            return [generalCircle];
        } catch (error) {
            // It might fail if another process creates it at the same time
            const generalCircle = await circlesCollection.findOne({ name: 'general' });
            if (generalCircle) {
                 return [{...generalCircle, _id: generalCircle._id.toString()}] as ICircle[];
            }
            return [];
        }
    }

    return circles.map(circle => ({
        ...circle,
        _id: circle._id.toString(),
    })) as ICircle[];
}

export async function getCircleByName(name: string): Promise<ICircle | null> {
  const circlesCollection = await getCirclesCollection();
  const circle = await circlesCollection.findOne({ name });

  if (!circle) {
    return null;
  }

  return {
    ...circle,
    _id: circle._id.toString(),
  } as ICircle;
}
