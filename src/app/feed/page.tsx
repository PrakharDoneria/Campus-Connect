
'use client';

import { useAuth } from '@/hooks/use-auth';
import { PostCard } from '@/components/common/PostCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { IPost, ICircle } from '@/types';
import { GraduationCap, Search, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getPosts } from '@/lib/actions/post.actions';
import { getCircles } from '@/lib/actions/circle.actions';
import { CreatePostForm } from '@/components/common/CreatePostForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Shimmer } from '@/components/common/Shimmer';


export default function FeedPage() {
  const { user, dbUser } = useAuth();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [circles, setCircles] = useState<ICircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [circleSearch, setCircleSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const isGuest = !user;

  const fetchPosts = useCallback(async (pageNum: number) => {
    setLoadingMore(true);
    try {
        const newPosts = await getPosts({ page: pageNum, limit: 5 });
        if (newPosts.length > 0) {
            setPosts(prev => pageNum === 1 ? newPosts : [...prev, ...newPosts]);
        } else {
            setHasMorePosts(false);
        }
    } catch (error) {
        console.error("Failed to fetch posts:", error);
    } finally {
        setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        fetchPosts(1);
        const fetchedCircles = await getCircles();
        setCircles(fetchedCircles);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [fetchPosts]);
  
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };
  
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
  
  const handlePostDelete = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
  };


  const renderPosts = (postsToRender: IPost[], emptyMessage: string, showPagination: boolean = false) => {
    if (loading && posts.length === 0) {
      return (
        <>
          <Shimmer className="h-48 w-full" />
          <Shimmer className="h-48 w-full" />
          <Shimmer className="h-48 w-full" />
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

    return (
        <div className="space-y-6">
            {limitedPosts.map((post) => (
              <PostCard 
                key={post._id.toString()} 
                post={post} 
                isGuest={isGuest}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
              />
            ))}
            {showPagination && !isGuest && hasMorePosts && (
                <div className="text-center">
                    <Button onClick={handleLoadMore} disabled={loadingMore}>
                        {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Load More'}
                    </Button>
                </div>
            )}
        </div>
    )
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
        <TabsContent value="everyone" className="mt-6">
          {renderPosts(posts, "It's awfully quiet in here... Be the first to post something!", true)}
        </TabsContent>
        <TabsContent value="your-circles" className="mt-6">
           {renderPosts(postsInUserCircles, "Join a circle or create one to see your curated feed!")}
        </TabsContent>
        <TabsContent value="circles" className="mt-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Find a circle, like 'memes' or 'study_group'"
                    value={circleSearch}
                    onChange={(e) => setCircleSearch(e.target.value)}
                    className="pl-10"
                />
            </div>
           <div className="mt-6">
                {renderPosts(searchedCirclePosts, circleSearch.trim() ? "No posts found for this circle. Maybe create it?" : "Type a circle name to discover new communities.")}
            </div>
        </TabsContent>
      </Tabs>

       {isGuest && !loading && (
        <div className="text-center py-10 mt-6 bg-card rounded-lg shadow-md">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold">You're viewing as a guest</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            Looks like you're on the outside looking in. Log in to join the party!
          </p>
          <Button asChild>
            <Link href="/">Login or Sign Up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
