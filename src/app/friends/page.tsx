
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { getUsers } from '@/lib/actions/user.actions';
import type { IUser } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, UserPlus, X } from 'lucide-react';
import Link from 'next/link';
import { acceptFriendRequest, rejectFriendRequest } from '@/lib/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

function FriendCard({ user, children }: { user: IUser, children?: React.ReactNode }) {
  return (
    <Card className="flex items-center p-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.photoUrl} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="ml-4 flex-grow">
        <Link href={`/profile/${user._id}`}>
            <p className="font-semibold hover:underline">{user.name}</p>
        </Link>
        <p className="text-sm text-muted-foreground">{user.university}</p>
      </div>
      <div className="ml-auto">{children}</div>
    </Card>
  );
}

export default function FriendsPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [friendRequests, setFriendRequests] = useState<IUser[]>([]);
  const [friends, setFriends] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchFriendData() {
      if (!dbUser) return;
      try {
        setLoading(true);
        const [requests, currentFriends] = await Promise.all([
          getUsers(dbUser.friendRequestsReceived),
          getUsers(dbUser.friends),
        ]);
        setFriendRequests(requests);
        setFriends(currentFriends);
      } catch (error) {
        console.error('Failed to fetch friend data:', error);
        toast({ title: "Error", description: "Could not fetch friend data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchFriendData();
  }, [dbUser, toast]);

  const handleRequestAction = async (fromUid: string, action: 'accept' | 'reject') => {
    if (!dbUser) return;
    setActionLoading(prev => ({ ...prev, [fromUid]: true }));
    try {
      if (action === 'accept') {
        await acceptFriendRequest(dbUser.uid, fromUid);
        toast({ title: "Friend Added!", description: "You are now friends." });
      } else {
        await rejectFriendRequest(dbUser.uid, fromUid);
        toast({ title: "Request Rejected" });
      }
      
      // Manually update state after action to give instant feedback
      if (action === 'accept') {
        const newFriend = friendRequests.find(u => u.uid === fromUid);
        if (newFriend) {
          setFriends(prev => [...prev, newFriend]);
        }
      }
      setFriendRequests(prev => prev.filter(u => u.uid !== fromUid));

    } catch (error) {
      console.error("Failed to handle friend request:", error);
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setActionLoading(prev => ({ ...prev, [fromUid]: false }));
      // Refresh router to get the freshest user state for subsequent actions
      router.refresh();
    }
  };

  if (loading || authLoading) {
    return (
        <div className="container mx-auto max-w-2xl p-4">
            <h1 className="text-3xl font-bold mb-6">Friends</h1>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>
      <Tabs defaultValue="friends">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">Your Friends ({friends.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({friendRequests.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="friends" className="mt-4">
          {friends.length > 0 ? (
            <div className="space-y-4">
              {friends.map(friend => (
                <FriendCard key={friend.uid} user={friend} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
              <p>You haven't added any friends yet.</p>
              <Button variant="link" asChild><Link href="/nearby">Find Students Nearby</Link></Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          {friendRequests.length > 0 ? (
            <div className="space-y-4">
              {friendRequests.map(requestUser => (
                <FriendCard key={requestUser.uid} user={requestUser}>
                  <div className="flex gap-2">
                    <Button 
                        size="icon" 
                        onClick={() => handleRequestAction(requestUser.uid, 'accept')}
                        disabled={actionLoading[requestUser.uid]}
                    >
                      {actionLoading[requestUser.uid] ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button 
                        size="icon" 
                        variant="destructive"
                        onClick={() => handleRequestAction(requestUser.uid, 'reject')}
                        disabled={actionLoading[requestUser.uid]}
                    >
                      {actionLoading[requestUser.uid] ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4" />}
                    </Button>
                  </div>
                </FriendCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
              <p>No pending friend requests.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
