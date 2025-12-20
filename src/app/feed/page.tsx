
'use client';

import { useAuth } from '@/hooks/use-auth';
import { PostCard } from '@/components/common/PostCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { IPost, ICircle, FeedItem, IAssignment, IDoubt, IUser } from '@/types';
import { GraduationCap, Search, Loader2, Users } from 'lucide-react';
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
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function SuggestionsCarousel({ users }: { users: IUser[] }) {
    if (users.length === 0) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">People you may know</CardTitle>
            </CardHeader>
            <CardContent>
                <Carousel opts={{ align: "start", loop: true }}>
                    <CarouselContent>
                        {users.map(user => (
                            <CarouselItem key={user.uid} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/3">
                                <UserCard user={user} variant="compact" />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </CardContent>
        </Card>
    );
}


function RecommendedCircles({ allCircles, userCircles }: { allCircles: ICircle[], userCircles: string[] }) {
    const recommended = allCircles.filter(c => !userCircles.includes(c.name)).slice(0, 5);
    
    if (recommended.length === 0) return null;

    return (
        <div className="p-4 rounded-lg bg-card border sticky top-20">
            <h3 className="font-bold text-lg mb-4">Recommended Circles</h3>
            <div className="space-y-2">
                {recommended.map(circle => (
                     <Link href={`/c/${circle.name}`} key={circle.name} className="block p-3 border rounded-lg hover:bg-muted transition-colors">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">c/{circle.name}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{circle.description}</p>
                            </div>
                            <Button variant="outline" size="sm">
                                View
                            </Button>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default function FeedPage() {
  const { user, dbUser } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [forYouItems, setForYouItems] = useState<FeedItem[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<IUser[]>([]);
  const [circles, setCircles] = useState<ICircle[]>([]);
  const [loading, setLoading] = useState(true);
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
  
  const interleavedFeedItems = useMemo(() => {
    const result: (FeedItem | { type: 'suggestions_carousel' })[] = [...feedItems];
    if (suggestedUsers.length > 0) {
      const position = 2; // Insert after the 2nd post
      if (result.length > position) {
        result.splice(position, 0, { type: 'suggestions_carousel' });
      } else {
        result.push({ type: 'suggestions_carousel' });
      }
    }
    return result;
  }, [feedItems, suggestedUsers]);


  const userJoinedCircles = useMemo(() => {
    if (!dbUser?.joinedCircles) return [];
    return circles.filter(c => dbUser.joinedCircles.includes(c.name));
  }, [circles, dbUser]);

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

  const renderItem = (item: FeedItem | { type: 'suggestions_carousel' }, index: number) => {
    if (item.type === 'suggestions_carousel') {
       return <SuggestionsCarousel key="suggestions" users={suggestedUsers} />;
    }
    
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

  const renderFeed = (itemsToRender: (FeedItem | { type: 'suggestions_carousel' })[], emptyMessage: string, showPagination: boolean = false) => {
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

    if (limitedItems.length === 0 && !loadingMore) {
      return (
        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card mt-6">
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
        <div className="space-y-6">
            {limitedItems.map((item, index) => renderItem(item, index))}
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
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {!isGuest && dbUser && (
            <CreatePostForm 
                user={dbUser} 
                circles={circles}
                onPostCreated={handleItemCreated as (p: IPost) => void} 
                onCircleCreated={handleCircleCreated}
            />
          )}
          
           <Tabs defaultValue="everyone" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="everyone">Everyone</TabsTrigger>
              <TabsTrigger value="for-you" disabled={!dbUser}>For You</TabsTrigger>
            </TabsList>
            <TabsContent value="everyone" className="mt-6">
              {renderFeed(interleavedFeedItems, "It's awfully quiet in here... Be the first to post something!", true)}
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

        <aside className="hidden lg:block lg:col-span-1">
          {dbUser && <RecommendedCircles allCircles={circles} userCircles={dbUser?.joinedCircles || []} />}
           <Card className="mt-8">
              <CardHeader><CardTitle>Your Circles</CardTitle></CardHeader>
              <CardContent>
                 <div className="space-y-4">
                  {userJoinedCircles.length > 0 ? (
                    userJoinedCircles.map(circle => (
                      <Link href={`/c/${circle.name}`} key={circle.name} className="block p-4 border rounded-lg hover:bg-muted">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">c/{circle.name}</h3>
                                <p className="text-sm text-muted-foreground">{circle.description}</p>
                            </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{circle.memberCount || 0}</span>
                            </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                     <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
                        <p>You haven't joined any circles yet.</p>
                        <Button asChild variant="link"><Link href="/search?q=">Explore Circles</Link></Button>
                    </div>
                  )}
                </div>
              </CardContent>
           </Card>
        </aside>
      </div>
    </div>
  );
}

    