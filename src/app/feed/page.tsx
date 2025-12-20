
'use client';

import { useAuth } from '@/hooks/use-auth';
import { PostCard } from '@/components/common/PostCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { IPost, ICircle, FeedItem, IAssignment, IDoubt, IUser } from '@/types';
import { GraduationCap, Search, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getFeedItems, getPostsForUserFeed } from '@/lib/actions/post.actions';
import { getRandomUsers } from '@/lib/actions/user.actions';
import { getCircles } from '@/lib/actions/circle.actions';
import { CreatePostForm } from '@/components/common/CreatePostForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Shimmer } from '@/components/common/Shimmer';
import { AssignmentCard } from '@/components/common/AssignmentCard';
import { DoubtCard } from '@/components/common/DoubtCard';
import { UserCard } from '@/components/common/UserCard';
import { SuggestionsCarousel } from '@/components/common/SuggestionsCarousel';


export default function FeedPage() {
  const { user, dbUser } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [forYouItems, setForYouItems] = useState<FeedItem[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<IUser[]>([]);
  const [circles, setCircles] = useState<ICircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [circleSearch, setCircleSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const isGuest = !user;

  const fetchFeed = useCallback(async (pageNum: number) => {
    setLoadingMore(true);
    try {
        const newItems = await getFeedItems({ page: pageNum, limit: 10 });
        if (newItems.length > 0) {
            setFeedItems(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
        } else {
            setHasMoreItems(false);
        }
    } catch (error) {
        console.error("Failed to fetch feed items:", error);
    } finally {
        setLoadingMore(false);
    }
  }, []);
  
  const fetchForYouFeed = useCallback(async () => {
    if (!dbUser || !dbUser.joinedCircles || dbUser.joinedCircles.length === 0) {
      setForYouItems([]);
      return;
    }
    try {
      const items = await getPostsForUserFeed(dbUser.joinedCircles);
      setForYouItems(items);
    } catch (error) {
      console.error("Failed to fetch 'For You' feed:", error);
    }
  }, [dbUser]);


  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const promises: Promise<any>[] = [
        fetchFeed(1),
        getCircles(),
      ];

      if (dbUser) {
        promises.push(getRandomUsers({ currentUserId: dbUser._id.toString(), preference: 'everyone' }));
        promises.push(fetchForYouFeed());
      }
      
      const [_, fetchedCircles, randomUsers] = await Promise.all(promises);

      if (fetchedCircles) setCircles(fetchedCircles);
      if (randomUsers) setSuggestedUsers(randomUsers);

      setLoading(false);
    }
    
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbUser, fetchForYouFeed]);
  
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage);
  };

  const userJoinedCircles = useMemo(() => {
    if (!dbUser?.joinedCircles) return [];
    return circles.filter(c => dbUser.joinedCircles.includes(c.name));
  }, [circles, dbUser]);

  const searchedCircleItems = useMemo(() => {
    if (!circleSearch.trim()) {
        return [];
    }
    const searchLower = circleSearch.toLowerCase();
    // Filter posts, assignments, doubts by circle name
    return feedItems.filter(item => item.circle.toLowerCase().includes(searchLower));
  }, [feedItems, circleSearch]);


  const handleItemCreated = (newItem: FeedItem) => {
    setFeedItems(prevItems => [newItem, ...prevItems]);
    if (dbUser?.joinedCircles?.includes(newItem.circle)) {
      setForYouItems(prev => [newItem, ...prev]);
    }
  };
  
  const handleCircleCreated = (newCircle: ICircle) => {
    setCircles(prevCircles => [...prevCircles, newCircle]);
  }

  const handlePostUpdate = (updatedPost: IPost) => {
    const updater = (p: FeedItem) => (p._id.toString() === updatedPost._id.toString() ? updatedPost : p);
    setFeedItems(prevItems => prevItems.map(updater));
    setForYouItems(prevItems => prevItems.map(updater));
  };
  
  const handlePostDelete = (postId: string) => {
    const filterer = (p: FeedItem) => p._id.toString() !== postId;
    setFeedItems(prevItems => prevItems.filter(filterer));
    setForYouItems(prevItems => prevItems.filter(filterer));
  };

  const renderItem = (item: FeedItem) => {
    const itemType = item.type || ('content' in item ? 'post' : null);

    switch (itemType) {
        case 'post':
            return <PostCard 
                key={(item._id as string) + '-post'}
                post={item as IPost} 
                isGuest={isGuest}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
              />;
        case 'assignment':
            return <AssignmentCard key={(item._id as string) + '-assignment'} assignment={item as IAssignment} />;
        case 'doubt':
            return <DoubtCard key={(item._id as string) + '-doubt'} doubt={item as IDoubt} />;
        default:
            return null;
    }
  }

  const renderFeed = (itemsToRender: FeedItem[], emptyMessage: string, showPagination: boolean = false) => {
    if (loading && itemsToRender.length === 0) {
      return (
        <div className="space-y-6">
          <Shimmer className="h-48 w-full" />
          <Shimmer className="h-64 w-full" />
          <Shimmer className="h-48 w-full" />
        </div>
      );
    }
    
    const limitedItems = isGuest ? itemsToRender.slice(0, 4) : itemsToRender;

    if (limitedItems.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card mt-6">
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
        <div className="space-y-6">
            {limitedItems.map((item) => renderItem(item))}
            {showPagination && !isGuest && hasMoreItems && (
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
            onPostCreated={handleItemCreated as (p: IPost) => void} 
            onCircleCreated={handleCircleCreated}
        />
      )}
      
       <Tabs defaultValue="everyone" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="everyone">Everyone</TabsTrigger>
          <TabsTrigger value="for-you" disabled={!dbUser}>For You</TabsTrigger>
          <TabsTrigger value="your-circles" disabled={!dbUser}>Your Circles</TabsTrigger>
        </TabsList>
        <TabsContent value="everyone" className="mt-6">
            {!isGuest && suggestedUsers.length > 0 && (
                <div className='mb-6'>
                    <h2 className="text-lg font-semibold mb-2">Suggested for you</h2>
                    <SuggestionsCarousel users={suggestedUsers} />
                </div>
            )}
          {renderFeed(feedItems, "It's awfully quiet in here... Be the first to post something!", true)}
        </TabsContent>
        <TabsContent value="for-you" className="mt-6">
           {dbUser && dbUser.joinedCircles && dbUser.joinedCircles.length > 0 ? (
             renderFeed(forYouItems, "No new posts from your circles.")
           ) : (
             <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card mt-6">
              <p>Join some circles to start building your personalized 'For You' feed!</p>
              <Button asChild variant="link"><Link href="/search?q=">Explore Circles</Link></Button>
            </div>
           )}
        </TabsContent>
        <TabsContent value="your-circles" className="mt-6">
            <div className="space-y-4">
              {userJoinedCircles.length > 0 ? (
                userJoinedCircles.map(circle => (
                  <Link href={`/c/${circle.name}`} key={circle.name} className="block p-4 border rounded-lg hover:bg-muted">
                    <h3 className="font-semibold">c/{circle.name}</h3>
                    <p className="text-sm text-muted-foreground">{circle.description}</p>
                  </Link>
                ))
              ) : (
                 <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
                    <p>You haven't joined any circles yet.</p>
                    <Button asChild variant="link"><Link href="/search?q=">Explore Circles</Link></Button>
                </div>
              )}
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

    