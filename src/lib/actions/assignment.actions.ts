
'use server';

import clientPromise from '@/lib/mongodb';
import { IAssignment, IUser } from '@/types';
import { Collection } from 'mongodb';

async function getAssignmentsCollection(): Promise<Collection<Omit<IAssignment, '_id'>>> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Omit<IAssignment, '_id'>>('assignments');
}

export async function createAssignment(
    data: { title: string; description: string; subject: string; dueDate: Date; circle: string; isPaid: boolean; reward?: string; },
    user: IUser
): Promise<IAssignment> {
  const assignmentsCollection = await getAssignmentsCollection();

  const newAssignmentData: Omit<IAssignment, '_id'> = {
    type: 'assignment',
    author: {
      uid: user.uid,
      name: user.name,
      avatarUrl: user.photoUrl || '',
      university: user.university || 'N/A',
    },
    title: data.title,
    description: data.description,
    subject: data.subject,
    circle: data.circle,
    dueDate: data.dueDate,
    isPaid: data.isPaid,
    reward: data.reward,
    createdAt: new Date(),
  };

  const result = await assignmentsCollection.insertOne(newAssignmentData);
  
  if (!result.insertedId) {
      throw new Error("Failed to create assignment.");
  }
  
  const createdAssignment = {
    ...newAssignmentData,
    _id: result.insertedId,
  };

  return {
    ...createdAssignment,
    _id: createdAssignment._id.toString(),
  } as IAssignment;
}

export async function getAssignments(): Promise<IAssignment[]> {
    const assignmentsCollection = await getAssignmentsCollection();
    const assignments = await assignmentsCollection.find({}).sort({ createdAt: -1 }).toArray();

    return assignments.map(assignment => ({
        ...assignment,
        _id: assignment._id.toString(),
    })) as IAssignment[];
}
