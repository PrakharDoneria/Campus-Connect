
import type { ObjectId } from 'mongodb';

export interface IUser {
  _id: string;
  uid: string;
  email: string;
  name: string;
  photoUrl?: string;
  university?: string;
  major?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
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
