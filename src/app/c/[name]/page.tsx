
'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getPostsByCircle } from '@/lib/actions/post.actions';
import { getCircleByName, joinCircle, leaveCircle, getCircleMembers } from '@/lib/actions/circle.actions';
import { IPost, ICircle, IUser } from '@/types';
import { PostCard } from '@/components/common/PostCard';
import { useAuth } from '@/hooks/use-auth';
import { CreatePostForm } from '@/components/common/CreatePostForm';
import { Shimmer } from '@/components/common/Shimmer';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FriendCard } from '@/components/common/FriendCard';

export default function CircleFeedPage() {
  const params = useParams();
  const name = params.name as string;
  const { user, dbUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<IPost[]>([]);
  const [circle, setCircle] = useState<ICircle | null>(null);
  const [members, setMembers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  
  const isMember = dbUser?.joinedCircles?.includes(name);

  useEffect(() => {
    async function fetchData() {
      if (!name) return;
      try {
        setLoading(true);
        const [fetchedCircle, fetchedPosts, fetchedMembers] = await Promise.all([
          getCircleByName(name),
          getPostsByCircle(name),
          getCircleMembers(name)
        ]);
        
        if (!fetchedCircle) {
          notFound();
          return;
        }

        setCircle(fetchedCircle);
        // Filter posts from blocked users
        if (dbUser?.blockedUsers) {
          const blockedUids = new Set(dbUser.blockedUsers);
          const filteredPosts = fetchedPosts.filter(post => !blockedUids.has(post.author.uid));
          setPosts(filteredPosts);
        } else {
          setPosts(fetchedPosts);
        }
        setMembers(fetchedMembers);
      } catch (error) {
        console.error('Failed to fetch circle data:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [name, dbUser]);
  
  const handlePostCreated = (newPost: IPost) => {
    if (newPost.circle === name) {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    }
  };

  const handlePostUpdate = (updatedPost: IPost) => {
    setPosts(prevPosts => prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };
  
   const handleCircleCreated = (newCircle: ICircle) => {
    window.location.reload();
  }

  const handleJoinOrLeave = async () => {
    if (!dbUser) {
        toast({ title: "Please login to join a circle", variant: "destructive" });
        return;
    }
    setIsJoining(true);
    try {
        if (isMember) {
            await leaveCircle(dbUser.uid, name);
            toast({ title: `Left c/${name}` });
        } else {
            await joinCircle(dbUser.uid, name);
            toast({ title: `Successfully joined c/${name}` });
        }
        window.location.reload(); 

    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsJoining(false);
    }
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
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold">c/{circle.name}</h1>
                <p className="text-muted-foreground mt-1">{circle.description}</p>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Users className="h-4 w-4" />
                    <span>{members.length} {members.length === 1 ? 'Member' : 'Members'}</span>
                </div>
            </div>
            {dbUser && (
                <Button onClick={handleJoinOrLeave} disabled={isJoining} variant={isMember ? 'outline' : 'default'}>
                    {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isMember ? 'Leave Circle' : 'Join Circle'}
                </Button>
            )}
        </div>
      </header>
      
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="feed" className="mt-6">
            {dbUser && isMember && (
                <div className="mb-6">
                <CreatePostForm 
                    user={dbUser} 
                    circles={[circle]} 
                    onPostCreated={handlePostCreated} 
                    onCircleCreated={handleCircleCreated}
                    defaultCircle={name}
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
        </TabsContent>
        <TabsContent value="members" className="mt-6">
            <div className="space-y-4">
                {members.map(member => (
                    <FriendCard key={member.uid} user={member} />
                ))}
            </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
