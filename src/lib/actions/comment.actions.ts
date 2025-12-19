
'use server';

import clientPromise from '@/lib/mongodb';
import { IComment, IPost, IUser } from '@/types';
import { Collection, ObjectId } from 'mongodb';
import { getUser } from './user.actions';
import { sendPushNotification } from './notification.actions';

async function getCommentsCollection(): Promise<Collection<Omit<IComment, '_id'>>> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Omit<IComment, '_id'>>('comments');
}

async function getPostsCollection(): Promise<Collection<Omit<IPost, '_id'>>> {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Omit<IPost, '_id'>>('posts');
}

export async function createComment(postId: string, content: string, user: IUser): Promise<IComment> {
  if (!user || !user.uid || !user.name) {
    throw new Error('User information is missing to create a comment.');
  }

  const commentsCollection = await getCommentsCollection();
  const postsCollection = await getPostsCollection();
  
  const newCommentData: Omit<IComment, '_id'> = {
    postId,
    author: {
      uid: user.uid,
      name: user.name,
      avatarUrl: user.photoUrl || '',
      university: user.university || 'N/A',
    },
    content,
    createdAt: new Date(),
  };

  const result = await commentsCollection.insertOne(newCommentData);
  if (!result.insertedId) {
    throw new Error('Failed to create the comment.');
  }
  
  const newCommentId = result.insertedId.toString();

  // Atomically update the post's comments array, fixing it if it's not an array
  await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    [
        { 
            $set: { 
                comments: {
                    $cond: {
                        if: { $isArray: "$comments" },
                        then: { $concatArrays: [ "$comments", [newCommentId] ] },
                        else: [newCommentId]
                    }
                }
            }
        }
    ]
  );

  // Send notification but don't let it block the response
  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (post && post.author.uid !== user.uid) {
      const author = await getUser(post.author.uid);
      if (author) {
        await sendPushNotification({
          userId: author.uid,
          title: `${user.name} commented on your post`,
          body: content.substring(0, 100),
        });
      }
    }
  } catch (error) {
      console.error("Failed to send comment notification, but comment was saved.", error);
  }


  const createdComment = {
    ...newCommentData,
    _id: result.insertedId,
  };

  return {
    ...createdComment,
    _id: createdComment._id.toString(),
  } as IComment;
}

export async function getCommentsByPost(postId: string): Promise<IComment[]> {
    const commentsCollection = await getCommentsCollection();
    const comments = await commentsCollection.find({ postId }).sort({ createdAt: -1 }).toArray();

    return comments.map(comment => ({
        ...comment,
        _id: comment._id.toString(),
    })) as IComment[];
}
