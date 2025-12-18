
'use client';

import { useAuth } from '@/hooks/use-auth';
import { PostCard } from '@/components/common/PostCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { IPost } from '@/types';
import { GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPosts } from '@/lib/actions/post.actions';
import { CreatePostForm } from '@/components/common/CreatePostForm';
import { Skeleton } from '@/components/ui/skeleton';


export default function FeedPage() {
  const { user, dbUser, signOut } = useAuth();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const isGuest = !user;

  useEffect(() => {
    async function fetchPosts() {
      try {
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost: IPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const postsToShow = isGuest ? posts.slice(0, 4) : posts;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
        <header className="flex items-center gap-4 mb-6 md:hidden">
            
            <h1 className="text-xl font-bold">Campus Feed</h1>
        </header>
      
      {!isGuest && dbUser && <CreatePostForm user={dbUser} onPostCreated={handlePostCreated} />}

      <div className="space-y-6 mt-6">
        {loading ? (
            <>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </>
        ) : (
            postsToShow.map((post) => (
              <PostCard key={post._id.toString()} post={post} isGuest={isGuest} />
            ))
        )}
        
        {!loading && posts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        )}
      </div>

       {isGuest && !loading && (
        <div className="text-center py-10 mt-6 bg-card rounded-lg shadow-md">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold">See What’s Happening</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            Log in to see more posts and connect with your campus community.
          </p>
          <Button asChild>
            <Link href="/">Login or Sign Up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
