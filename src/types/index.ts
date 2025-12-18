
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
  friends: string[]; // array of UIDs
  friendRequestsSent: string[]; // array of UIDs
  friendRequestsReceived: string[]; // array of UIDs
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
    circle: string; // Circle name
    createdAt: Date;
    likes: string[]; // Array of user UIDs
    comments: number; // Keep it simple for now
}

export interface ICircle {
  _id: string | ObjectId;
  name:string;
  description: string;
  creatorUid: string;
  createdAt: Date;
}
