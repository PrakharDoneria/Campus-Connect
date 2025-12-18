
'use client';

import { useAuth } from '@/hooks/use-auth';
import { PostCard } from '@/components/common/PostCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { IPost, ICircle } from '@/types';
import { GraduationCap, Search } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getPosts } from '@/lib/actions/post.actions';
import { getCircles } from '@/lib/actions/circle.actions';
import { CreatePostForm } from '@/components/common/CreatePostForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';


export default function FeedPage() {
  const { user, dbUser } = useAuth();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [circles, setCircles] = useState<ICircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [circleSearch, setCircleSearch] = useState('');
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
    // Also include circles user has posted in
    const postedInCircleNames = posts.filter(p => p.author.uid === dbUser.uid).map(p => p.circle);
    const activityCircles = [...new Set([...createdCircleNames, ...postedInCircleNames])];
    // Always include 'general' if it's not there and the user has some activity
    if (activityCircles.length > 0 && !activityCircles.includes('general')) {
      activityCircles.push('general');
    }
    return activityCircles;
  }, [circles, posts, dbUser]);


  const postsInUserCircles = useMemo(() => {
    // If user has no activity, don't show any posts in this tab.
    if(circlesWithUserActivity.length === 0) return [];
    return posts.filter(p => circlesWithUserActivity.includes(p.circle));
  }, [posts, circlesWithUserActivity]);

  const searchedCirclePosts = useMemo(() => {
    if (!circleSearch.trim()) {
        // Show nothing by default until user searches
        return [];
    }
    return posts.filter(p => p.circle.toLowerCase().includes(circleSearch.toLowerCase()));
  }, [posts, circleSearch]);


  const handlePostCreated = (newPost: IPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };
  
  const handleCircleCreated = (newCircle: ICircle) => {
    setCircles(prevCircles => [...prevCircles, newCircle]);
  }

  const handlePostUpdate = (updatedPost: IPost) => {
    setPosts(prevPosts => prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };


  const renderPosts = (postsToRender: IPost[], emptyMessage: string) => {
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
        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card mt-6">
          <p>{emptyMessage}</p>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="everyone">Everyone</TabsTrigger>
          <TabsTrigger value="your-circles">Your Circles</TabsTrigger>
          <TabsTrigger value="circles">Search Circles</TabsTrigger>
        </TabsList>
        <TabsContent value="everyone">
          <div className="space-y-6 mt-6">
            {renderPosts(posts, "No posts yet. Be the first to share something!")}
          </div>
        </TabsContent>
        <TabsContent value="your-circles">
           <div className="space-y-6 mt-6">
            {renderPosts(postsInUserCircles, "Post in a circle or create one to see content here.")}
          </div>
        </TabsContent>
        <TabsContent value="circles">
            <div className="relative mt-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search for a circle, e.g., 'study_group'"
                    value={circleSearch}
                    onChange={(e) => setCircleSearch(e.target.value)}
                    className="pl-10"
                />
            </div>
           <div className="space-y-6 mt-6">
            {renderPosts(searchedCirclePosts, circleSearch.trim() ? "No posts found for this circle." : "Type a circle name to find posts.")}
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
