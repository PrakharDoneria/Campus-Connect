
'use client';

import { IUser } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, MessageSquare, UserCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { sendFriendRequest } from '@/lib/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export function UserCard({ user }: { user: IUser }) {
  const { dbUser, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddFriend = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!dbUser) {
      toast({ title: "Please login", description: "You need to be logged in to add friends." });
      return;
    }
    setIsSubmitting(true);
    try {
      await sendFriendRequest(dbUser.uid, user.uid);
      toast({ title: "Request Sent!", description: `Friend request sent to ${user.name}.` });
      router.refresh(); // Refresh the page to update the UI
    } catch (error) {
      toast({ title: "Error", description: "Could not send friend request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const friendStatus = useMemo(() => {
    if (!dbUser || !user) return null;
    if (dbUser.friends.includes(user.uid)) return 'friends';
    if (dbUser.friendRequestsSent.includes(user.uid)) return 'sent';
    if (dbUser.friendRequestsReceived.includes(user.uid)) return 'received';
    return null;
  }, [dbUser, user]);

  const renderFriendButton = () => {
    if (isSubmitting || loading) {
      return <Button size="sm" className="flex-1" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</Button>;
    }

    switch (friendStatus) {
      case 'friends':
        return <Button size="sm" className="flex-1" disabled><UserCheck className="mr-2 h-4 w-4" /> Friends</Button>;
      case 'sent':
        return <Button size="sm" variant="secondary" className="flex-1" disabled>Request Sent</Button>;
      case 'received':
        return <Button size="sm" asChild className="flex-1"><Link href="/friends">Respond</Link></Button>;
      default:
        return <Button size="sm" className="flex-1" onClick={handleAddFriend}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>;
    }
  };

  return (
    <Link href={`/profile/${user._id.toString()}`}>
        <Card className="flex flex-col items-center justify-center p-4 text-center h-full transition-all hover:shadow-lg hover:border-primary">
        <CardHeader className="p-2">
            <Avatar className="w-24 h-24 mx-auto border-4 border-primary">
            <AvatarImage src={user.photoUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
        </CardHeader>
        <CardContent className="p-2 space-y-2 flex-grow">
            <h3 className="font-bold text-lg">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.university}</p>
            <p className="text-xs text-muted-foreground">{user.major}</p>
        </CardContent>
        <div className="flex w-full gap-2 mt-4">
            {dbUser?.uid !== user.uid && renderFriendButton()}
            <Button size="sm" variant="outline" className="flex-1" asChild>
                <Link href={`/messages?with=${user.uid}`} onClick={e => e.stopPropagation()}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                </Link>
            </Button>
        </div>
        </Card>
    </Link>
  );
}
