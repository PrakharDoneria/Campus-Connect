
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
  joinedCircles: string[]; // array of circle names
  universityCircle?: string; // name of the main university circle
}

export interface PostAuthor {
    uid: string;
    name: string;
    avatarUrl: string;
    university: string;
}

export interface IPost {
    _id: string | ObjectId;
    type: 'post';
    author: PostAuthor;
    content: string;
    imageUrl?: string;
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
  memberCount?: number;
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

export interface IDoubt {
  _id: string | ObjectId;
  type: 'doubt';
  author: PostAuthor;
  title: string;
  description: string;
  subject: string;
  circle: string;
  createdAt: Date;
  answers: (string | ObjectId)[];
}

export interface IAssignment {
  _id: string | ObjectId;
  type: 'assignment';
  author: PostAuthor;
  title: string;
  description: string;
  subject: string;
  circle: string;
  dueDate: Date;
  isPaid: boolean;
  reward?: string;
  createdAt: Date;
}

export type FeedItem = IPost | IDoubt | IAssignment;
