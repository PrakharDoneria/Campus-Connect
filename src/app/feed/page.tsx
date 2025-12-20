
'use client';

import { useAuth } from '@/hooks/use-auth';
import { PostCard } from '@/components/common/PostCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { IPost, ICircle, FeedItem, IAssignment, IDoubt } from '@/types';
import { GraduationCap, Search, Loader2, DollarSign } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getFeedItems } from '@/lib/actions/post.actions';
import { getCircles } from '@/lib/actions/circle.actions';
import { CreatePostForm } from '@/components/common/CreatePostForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Shimmer } from '@/components/common/Shimmer';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';

function AssignmentCard({ assignment }: { assignment: IAssignment }) {
    return (
        <Card className="border-l-4 border-accent">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={assignment.author.avatarUrl} alt={assignment.author.name} />
                        <AvatarFallback>{assignment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{assignment.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>by {assignment.author.name}</span>
                            <span>•</span>
                             <Link href={`/c/${assignment.circle}`} className="hover:underline">
                                c/{assignment.circle}
                            </Link>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })}</span>
                        </div>
                         <p className="text-sm font-bold text-primary mt-1">{assignment.subject}</p>
                    </div>
                     {assignment.isPaid && (
                        <div className="flex items-center gap-2 text-lg font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
                            <DollarSign className="h-5 w-5" />
                            <span>{assignment.reward}</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{assignment.description}</p>
                <p className="text-sm text-destructive font-semibold mt-4">Due: {format(new Date(assignment.dueDate), "PPP")}</p>
                <Button asChild className="mt-4">
                    <Link href="/assignments">View Details</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function DoubtCard({ doubt }: { doubt: IDoubt }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={doubt.author.avatarUrl} alt={doubt.author.name} />
                        <AvatarFallback>{doubt.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{doubt.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>by {doubt.author.name}</span>
                            <span>•</span>
                            <Link href={`/c/${doubt.circle}`} className="hover:underline">
                                c/{doubt.circle}
                            </Link>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(doubt.createdAt), { addSuffix: true })}</span>
                        </div>
                         <p className="text-sm font-bold text-primary mt-1">{doubt.subject}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{doubt.description}</p>
                 <Button asChild className="mt-4">
                    <Link href="/doubts">View Details & Answer</Link>
                </Button>
            </CardContent>
        </Card>
    );
}


export default function FeedPage() {
  const { user, dbUser } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
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
        const newItems = await getFeedItems({ page: pageNum, limit: 5 });
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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        fetchFeed(1);
        const fetchedCircles = await getCircles();
        setCircles(fetchedCircles);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [fetchFeed]);
  
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage);
  };
  
  const circlesWithUserActivity = useMemo(() => {
    if (!dbUser) return [];
    const createdCircleNames = circles.filter(c => c.creatorUid === dbUser.uid).map(c => c.name);
    // Also include circles user has posted in
    const postedInCircleNames = feedItems.filter(p => p.author.uid === dbUser.uid).map(p => p.circle);
    const activityCircles = [...new Set([...createdCircleNames, ...postedInCircleNames])];
    // Always include 'general' if it's not there and the user has some activity
    if (activityCircles.length > 0 && !activityCircles.includes('general')) {
      activityCircles.push('general');
    }
    return activityCircles;
  }, [circles, feedItems, dbUser]);


  const itemsInUserCircles = useMemo(() => {
    if(circlesWithUserActivity.length === 0) return [];
    return feedItems.filter(p => circlesWithUserActivity.includes(p.circle));
  }, [feedItems, circlesWithUserActivity]);

  const searchedCircleItems = useMemo(() => {
    if (!circleSearch.trim()) {
        return [];
    }
    return feedItems.filter(p => p.circle.toLowerCase().includes(circleSearch.toLowerCase()));
  }, [feedItems, circleSearch]);


  const handleItemCreated = (newItem: FeedItem) => {
    setFeedItems(prevItems => [newItem, ...prevItems]);
  };
  
  const handleCircleCreated = (newCircle: ICircle) => {
    setCircles(prevCircles => [...prevCircles, newCircle]);
  }

  const handlePostUpdate = (updatedPost: IPost) => {
    setFeedItems(prevItems => prevItems.map(p => p._id === updatedPost._id ? updatedPost : p));
  };
  
  const handlePostDelete = (postId: string) => {
    setFeedItems(prevItems => prevItems.filter(p => p._id !== postId));
  };

  const renderItem = (item: FeedItem) => {
    switch (item.type) {
        case 'post':
            return <PostCard 
                key={item._id.toString()} 
                post={item} 
                isGuest={isGuest}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
              />;
        case 'assignment':
            return <AssignmentCard key={item._id.toString()} assignment={item} />;
        case 'doubt':
            return <DoubtCard key={item._id.toString()} doubt={item} />;
        default:
            return null;
    }
  }

  const renderFeed = (itemsToRender: FeedItem[], emptyMessage: string, showPagination: boolean = false) => {
    if (loading && feedItems.length === 0) {
      return (
        <>
          <Shimmer className="h-48 w-full" />
          <Shimmer className="h-48 w-full" />
          <Shimmer className="h-48 w-full" />
        </>
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
          <TabsTrigger value="your-circles">Your Circles</TabsTrigger>
          <TabsTrigger value="circles">Search Circles</TabsTrigger>
        </TabsList>
        <TabsContent value="everyone" className="mt-6">
          {renderFeed(feedItems, "It's awfully quiet in here... Be the first to post something!", true)}
        </TabsContent>
        <TabsContent value="your-circles" className="mt-6">
           {renderFeed(itemsInUserCircles, "Join a circle or create one to see your curated feed!")}
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
                {renderFeed(searchedCircleItems, circleSearch.trim() ? "No posts found for this circle. Maybe create it?" : "Type a circle name to discover new communities.")}
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
