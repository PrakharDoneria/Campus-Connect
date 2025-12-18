
'use client';

import { useAuth } from '@/hooks/use-auth';
import { PostCard } from '@/components/common/PostCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { IPost, ICircle } from '@/types';
import { GraduationCap } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getPosts } from '@/lib/actions/post.actions';
import { getCircles } from '@/lib/actions/circle.actions';
import { CreatePostForm } from '@/components/common/CreatePostForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function FeedPage() {
  const { user, dbUser } = useAuth();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [circles, setCircles] = useState<ICircle[]>([]);
  const [loading, setLoading] = useState(true);
  const isGuest = !user;

  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedPosts, fetchedCircles] = await Promise.all([
            getPosts(),
            getCircles()
        ]);
        setPosts(fetchedPosts);
        setCircles(fetchedCircles);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  
  const circlesWithUserActivity = useMemo(() => {
    if (!dbUser) return [];
    const createdCircleNames = circles.filter(c => c.creatorUid === dbUser.uid).map(c => c.name);
    const postedInCircleNames = posts.filter(p => p.author.uid === dbUser.uid).map(p => p.circle);
    return [...new Set([...createdCircleNames, ...postedInCircleNames])];
  }, [circles, posts, dbUser]);

  const postsInUserCircles = useMemo(() => {
    return posts.filter(p => circlesWithUserActivity.includes(p.circle));
  }, [posts, circlesWithUserActivity]);


  const handlePostCreated = (newPost: IPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };
  
  const handleCircleCreated = (newCircle: ICircle) => {
    setCircles(prevCircles => [...prevCircles, newCircle]);
  }

  const handlePostUpdate = (updatedPost: IPost) => {
    setPosts(prevPosts => prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };


  const renderPosts = (postsToRender: IPost[]) => {
    if (loading) {
      return (
        <>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </>
      );
    }
    
    const limitedPosts = isGuest ? postsToRender.slice(0, 4) : postsToRender;

    if (limitedPosts.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <p>No posts yet. Be the first to share something!</p>
        </div>
      );
    }

    return limitedPosts.map((post) => (
      <PostCard 
        key={post._id.toString()} 
        post={post} 
        isGuest={isGuest}
        onPostUpdate={handlePostUpdate}
      />
    ));
  };


  return (
    <div className="container mx-auto p-4 max-w-2xl">
      
      {!isGuest && dbUser && (
        <CreatePostForm 
            user={dbUser} 
            circles={circles}
            onPostCreated={handlePostCreated} 
            onCircleCreated={handleCircleCreated}
        />
      )}
      
       <Tabs defaultValue="everyone" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="everyone">Everyone</TabsTrigger>
          <TabsTrigger value="your-circles">Your Circles</TabsTrigger>
        </TabsList>
        <TabsContent value="everyone">
          <div className="space-y-6 mt-6">
            {renderPosts(posts)}
          </div>
        </TabsContent>
        <TabsContent value="your-circles">
           <div className="space-y-6 mt-6">
            {renderPosts(postsInUserCircles)}
          </div>
        </TabsContent>
      </Tabs>

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
