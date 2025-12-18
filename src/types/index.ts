
import type { ObjectId } from 'mongodb';

export type Gender = 'male' | 'female' | 'other';

export interface IUser {
  _id: string;
  uid: string;
  email: string;
  name: string;
  photoUrl?: string;
  university?: string;
  major?: string;
  gender?: Gender;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  fcmToken?: string;
}

export interface PostAuthor {
    uid: string;
    name: string;
    avatarUrl: string;
    university: string;
}

export interface IPost {
    _id: string | ObjectId;
    author: PostAuthor;
    content: string;
    createdAt: Date;
    likes: string[]; // Array of user UIDs
    comments: number; // Keep it simple for now
}
