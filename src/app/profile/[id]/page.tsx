
'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { getUser, sendFriendRequest, getUsers } from '@/lib/actions/user.actions';
import { getPostsByAuthor } from '@/lib/actions/post.actions';
import { IUser, IPost } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, GraduationCap, MessageSquare, UserPlus, Edit, Loader2, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/common/PostCard';
import { useToast } from '@/hooks/use-toast';
import { FriendCard } from '@/components/common/FriendCard';

export default function UserProfilePage() {
  const { user: currentUser, dbUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<IUser | null>(null);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [friends, setFriends] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);
        const fetchedUser = await getUser(id);
        if (!fetchedUser) {
          notFound();
          return;
        }
        setUser(fetchedUser);

        const [userPosts, userFriends] = await Promise.all([
            getPostsByAuthor(fetchedUser.uid),
            getUsers(fetchedUser.friends)
        ]);
        
        setPosts(userPosts);
        setFriends(userFriends);

      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast({ title: "Error", description: "Could not load profile.", variant: "destructive" });
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);
  
  const handlePostUpdate = (updatedPost: IPost) => {
    setPosts(prevPosts => prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };


  const isOwnProfile = currentUser?.uid === user?.uid;

  const handleAddFriend = async () => {
    if (!dbUser || !user) return;
    setIsSubmitting(true);
    try {
      await sendFriendRequest(dbUser.uid, user.uid);
      toast({ title: "Request Sent!", description: `Friend request sent to ${user.name}.` });
       // Manually update the state to give instant feedback
      const updatedDbUser = { ...dbUser, friendRequestsSent: [...dbUser.friendRequestsSent, user.uid] };
      // This is a bit of a hack, but it forces a re-render of the button state
      // In a real app with global state management, this would be cleaner.
      setUser(user);
      router.refresh();
    } catch (error) {
      toast({ title: "Error", description: "Could not send friend request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFriendStatus = () => {
    if (authLoading || !dbUser || !user) return null;
    if (dbUser.friends.includes(user.uid)) return 'friends';
    if (dbUser.friendRequestsSent.includes(user.uid)) return 'sent';
    if (dbUser.friendRequestsReceived.includes(user.uid)) return 'received';
    return null;
  };
  
  const friendStatus = getFriendStatus();

  const renderFriendButton = () => {
    if (isSubmitting) {
        return <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Please Wait</Button>
    }

    switch (friendStatus) {
        case 'friends':
            return <Button disabled variant="secondary"><UserCheck className="mr-2 h-4 w-4" /> Friends</Button>;
        case 'sent':
            return <Button disabled variant="secondary">Request Sent</Button>;
        case 'received':
            return <Button asChild><Link href="/friends">Respond to Request</Link></Button>;
        default:
            return <Button onClick={handleAddFriend}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl space-y-8">
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-[50px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!user) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card className="overflow-hidden">
        <div className="h-32 bg-muted" />
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 -mt-20">
            <Avatar className="w-32 h-32 border-4 border-background shrink-0">
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="mt-4 sm:mt-0 flex-grow">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{user.university}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>{user.major}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-start gap-2 mt-4 sm:ml-auto sm:self-end shrink-0">
              {isOwnProfile ? (
                <Button asChild variant="outline">
                  <Link href="/profile/edit"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link>
                </Button>
              ) : (
                <>
                  {renderFriendButton()}
                  <Button variant="outline" asChild disabled={friendStatus !== 'friends'}>
                    <Link href="/messages">
                      <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="posts" className="mt-8">
        <TabsList>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4">
            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => <PostCard key={post._id.toString()} post={post} onPostUpdate={handlePostUpdate} />)}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
                    <p>This user hasn't posted anything yet.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="friends" className="mt-4">
            {friends.length > 0 ? (
                <div className="space-y-4">
                    {friends.map(friend => <FriendCard key={friend.uid} user={friend} />)}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
                    <p>This user doesn't have any friends yet.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
