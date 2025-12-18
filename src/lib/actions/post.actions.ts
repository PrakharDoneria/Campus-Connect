
'use server';

import clientPromise from '@/lib/mongodb';
import { IPost, IUser } from '@/types';
import { Collection, ObjectId } from 'mongodb';
import { getAdminApp, getMessaging } from '../firebase-admin';
import { getUser } from './user.actions';

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
    comments: [], // Changed to an array of comment IDs
  };

  const result = await postsCollection.insertOne(newPostData);
  
  if (!result.insertedId) {
      throw new Error('Failed to create the post.');
  }

  const createdPost = {
    ...newPostData,
    _id: result.insertedId,
  }

  return {
    ...createdPost,
    _id: createdPost._id.toString(),
  } as IPost;
}

export async function getPosts({ page = 1, limit = 10 }: { page?: number; limit?: number; } = {}): Promise<IPost[]> {
    const postsCollection = await getPostsCollection();
    const skip = (page - 1) * limit;
    const posts = await postsCollection.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

    // Convert _id to string for each post
    return posts.map(post => ({
        ...post,
        _id: post._id.toString(),
    })) as IPost[];
}

export async function getPostsByAuthor(authorUid: string): Promise<IPost[]> {
  const postsCollection = await getPostsCollection();
  const posts = await postsCollection.find({ 'author.uid': authorUid }).sort({ createdAt: -1 }).toArray();
  return posts.map(post => ({
    ...post,
    _id: post._id.toString(),
  })) as IPost[];
}

export async function getPostsByCircle(circleName: string): Promise<IPost[]> {
  const postsCollection = await getPostsCollection();
  const posts = await postsCollection.find({ circle: circleName }).sort({ createdAt: -1 }).toArray();
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

  // Send notification if the post is being liked (not unliked)
  if (!isLiked && post.author.uid !== userId) {
    try {
      const [liker, author] = await Promise.all([
        getUser(userId),
        getUser(post.author.uid),
      ]);

      if (liker && author?.fcmToken) {
        getAdminApp(); // Ensure admin app is initialized
        const messaging = getMessaging();
        
        const messagePayload = {
            notification: {
                title: `${liker.name} liked your post!`,
                body: `"${post.content.substring(0, 50)}..."`,
            },
            token: author.fcmToken,
            webpush: {
              fcmOptions: {
                link: `${process.env.NEXT_PUBLIC_BASE_URL}/feed` // Or a more specific post link if available
              }
            }
        };
        await messaging.send(messagePayload);
      }
    } catch (error) {
        console.error("Failed to send like notification:", error);
    }
  }


  return !isLiked;
}

export async function updatePost(postId: string, content: string): Promise<IPost> {
  const postsCollection = await getPostsCollection();
  const result = await postsCollection.findOneAndUpdate(
    { _id: new ObjectId(postId) },
    { $set: { content, editedAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new Error('Post not found or update failed.');
  }

  return { ...result, _id: result._id.toString() } as unknown as IPost;
}

export async function deletePost(postId: string): Promise<void> {
  const postsCollection = await getPostsCollection();
  const result = await postsCollection.deleteOne({ _id: new ObjectId(postId) });

  if (result.deletedCount === 0) {
    throw new Error('Post not found or could not be deleted.');
  }
}
