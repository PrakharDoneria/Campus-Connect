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
    name: string;
    avatarUrl: string;
    university: string;
}

export interface Post {
    id: string;
    author: PostAuthor;
    timestamp: string;
    content: string;
    imageUrl?: string;
    likes: number;
    comments: number;
}
