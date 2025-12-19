
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
  friends: string[]; // array of UIDs
  friendRequestsSent: string[]; // array of UIDs
  friendRequestsReceived: string[]; // array of UIDs
  blockedUsers?: string[]; // array of UIDs
  pushSubscription?: PushSubscriptionJSON;
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
    editedAt?: Date;
    likes: string[]; // Array of user UIDs
    comments: (string | ObjectId)[]; // Array of comment IDs
}

export interface IComment {
  _id: string | ObjectId;
  postId: string;
  author: PostAuthor;
  content: string;
  createdAt: Date;
}

export interface ICircle {
  _id: string | ObjectId;
  name:string;
  description: string;
  creatorUid: string;
  createdAt: Date;
}

export interface IMessage {
  _id: string | ObjectId;
  conversationId: string;
  from: string; // UID of sender
  to: string; // UID of receiver
  text: string;
  createdAt: Date;
  read: boolean;
}
