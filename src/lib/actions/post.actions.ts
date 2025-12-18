
'use server';

import clientPromise from '@/lib/mongodb';
import { IPost, IUser } from '@/types';
import { Collection, ObjectId } from 'mongodb';

async function getPostsCollection(): Promise<Collection<Omit<IPost, '_id'>>> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Omit<IPost, '_id'>>('posts');
}

export async function createPost(content: string, circle: string, user: IUser): Promise<IPost> {
  if (!user || !user.uid || !user.name || !user.university) {
    throw new Error('User information is missing to create a post.');
  }
  if (!circle) {
    throw new Error('Circle is required to create a post.');
  }

  const postsCollection = await getPostsCollection();
  
  const newPostData: Omit<IPost, '_id'> = {
    author: {
      uid: user.uid,
      name: user.name,
      avatarUrl: user.photoUrl || '',
      university: user.university,
    },
    content: content,
    circle: circle,
    createdAt: new Date(),
    likes: [],
    comments: 0,
  };

  const result = await postsCollection.insertOne(newPostData);
  
  if (!result.insertedId) {
      throw new Error('Failed to create the post.');
  }

  return {
    ...newPostData,
    _id: result.insertedId.toString(),
  } as IPost;
}

export async function getPosts(): Promise<IPost[]> {
    const postsCollection = await getPostsCollection();
    const posts = await postsCollection.find({}).sort({ createdAt: -1 }).toArray();

    // Convert _id to string for each post
    return posts.map(post => ({
        ...post,
        _id: post._id.toString(),
    })) as IPost[];
}

export async function toggleLikePost(postId: string, userId: string): Promise<boolean> {
  const postsCollection = await getPostsCollection();
  const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

  if (!post) {
    throw new Error('Post not found');
  }

  const isLiked = post.likes.includes(userId);
  const updateOperation = isLiked
    ? { $pull: { likes: userId } }
    : { $push: { likes: userId } };
  
  await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    updateOperation
  );

  return !isLiked;
}
