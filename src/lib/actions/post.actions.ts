
'use server';

import clientPromise from '@/lib/mongodb';
import { IPost, IUser, FeedItem } from '@/types';
import { Collection, ObjectId } from 'mongodb';
import { getUser } from './user.actions';
import { sendPushNotification } from './notification.actions';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else {
  console.warn('CLOUDINARY_URL is not set. Image uploads will not work.');
}


async function getPostsCollection(): Promise<Collection<Omit<IPost, '_id'>>> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Omit<IPost, '_id'>>('posts');
}

async function uploadImage(base64Image: string): Promise<string> {
    if (!process.env.CLOUDINARY_URL) {
        throw new Error("Cloudinary is not configured.");
    }
    try {
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'campus-connect',
        });
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw new Error("Failed to upload image.");
    }
}

export async function createPost(
    { content, circle, imageBase64 }: { content: string; circle: string; imageBase64?: string },
    user: IUser
): Promise<IPost> {
  if (!user || !user.uid || !user.name || !user.university) {
    throw new Error('User information is missing to create a post.');
  }
  if (!circle) {
    throw new Error('Circle is required to create a post.');
  }

  let imageUrl: string | undefined;
  if (imageBase64) {
      imageUrl = await uploadImage(imageBase64);
  }

  const postsCollection = await getPostsCollection();
  
  const newPostData: Omit<IPost, '_id'> = {
    type: 'post',
    author: {
      uid: user.uid,
      name: user.name,
      avatarUrl: user.photoUrl || '',
      university: user.university,
    },
    content: content,
    circle: circle,
    imageUrl,
    createdAt: new Date(),
    likes: [],
    comments: [], // Always initialize as an empty array
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

export async function getFeedItems({ page = 1, limit = 10 }: { page?: number; limit?: number; } = {}): Promise<FeedItem[]> {
    const client = await clientPromise;
    const db = client.db();
    
    const skip = (page - 1) * limit;

    const pipeline = [
        { $unionWith: { coll: 'assignments' } },
        { $unionWith: { coll: 'doubts' } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
    ];

    const feedItems = await db.collection('posts').aggregate(pipeline).toArray();

    return feedItems.map(item => ({
        ...item,
        _id: item._id.toString(),
    })) as FeedItem[];
}

export async function getPostsForUserFeed(joinedCircles: string[]): Promise<FeedItem[]> {
    if (!joinedCircles || joinedCircles.length === 0) {
        return [];
    }

    const client = await clientPromise;
    const db = client.db();

    const pipeline = [
        { $match: { circle: { $in: joinedCircles } } },
        { $unionWith: { 
            coll: 'assignments', 
            pipeline: [ { $match: { circle: { $in: joinedCircles } } } ]
        } },
        { $unionWith: { 
            coll: 'doubts',
            pipeline: [ { $match: { circle: { $in: joinedCircles } } } ]
        } },
        { $sort: { createdAt: -1 } },
        { $limit: 50 } // Limit the "For You" feed size for performance
    ];

    const feedItems = await db.collection('posts').aggregate(pipeline).toArray();

    return feedItems.map(item => ({
        ...item,
        _id: item._id.toString(),
    })) as FeedItem[];
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
    const liker = await getUser(userId);
    const author = await getUser(post.author.uid);

    if (liker && author) {
      await sendPushNotification({
        userId: author.uid,
        title: `${liker.name} liked your post!`,
        body: `"${post.content.substring(0, 50)}..."`,
      });
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
