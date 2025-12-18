
'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getPostsByCircle } from '@/lib/actions/post.actions';
import { getCircleByName } from '@/lib/actions/circle.actions';
import { IPost, ICircle } from '@/types';
import { PostCard } from '@/components/common/PostCard';
import { useAuth } from '@/hooks/use-auth';
import { CreatePostForm } from '@/components/common/CreatePostForm';
import { Shimmer } from '@/components/common/Shimmer';

export default function CircleFeedPage() {
  const params = useParams();
  const name = params.name as string;
  const { user, dbUser, loading: authLoading } = useAuth();

  const [posts, setPosts] = useState<IPost[]>([]);
  const [circle, setCircle] = useState<ICircle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!name) return;
      try {
        setLoading(true);
        const [fetchedCircle, fetchedPosts] = await Promise.all([
          getCircleByName(name),
          getPostsByCircle(name),
        ]);
        
        if (!fetchedCircle) {
          notFound();
          return;
        }

        setCircle(fetchedCircle);
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Failed to fetch circle data:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [name]);
  
  const handlePostCreated = (newPost: IPost) => {
    if (newPost.circle === name) {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    }
  };

  const handlePostUpdate = (updatedPost: IPost) => {
    setPosts(prevPosts => prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };
  
  if (loading || authLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl space-y-6">
        <Shimmer className="h-24 w-full" />
        <Shimmer className="h-10 w-48" />
        <div className="space-y-6">
            <Shimmer className="h-48 w-full" />
            <Shimmer className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!circle) {
    return notFound();
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">c/{circle.name}</h1>
        <p className="text-muted-foreground mt-1">{circle.description}</p>
      </header>

      {dbUser && (
        <div className="mb-6">
          <CreatePostForm 
            user={dbUser} 
            circles={[circle]} 
            onPostCreated={handlePostCreated} 
            onCircleCreated={() => {}} 
          />
        </div>
      )}

      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard 
              key={post._id.toString()} 
              post={post} 
              isGuest={!user} 
              onPostUpdate={handlePostUpdate} 
            />
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
            <p>This circle is quieter than a library during finals. Be the first to post!</p>
          </div>
        )}
      </div>
    </div>
  );
}
