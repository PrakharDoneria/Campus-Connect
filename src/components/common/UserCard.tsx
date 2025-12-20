
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
import { cn } from '@/lib/utils';

export function UserCard({ user, variant = 'default' }: { user: IUser, variant?: 'default' | 'compact' }) {
  const { dbUser, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddFriend = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dbUser) {
      toast({ title: "Please login", description: "You need to be logged in to add friends." });
      return;
    }
    setIsSubmitting(true);
    try {
      await sendFriendRequest(dbUser.uid, user.uid);
      toast({ title: "Request Sent!", description: `Friend request sent to ${user.name}.` });
      router.refresh(); 
    } catch (error) {
      toast({ title: "Error", description: "Could not send friend request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const friendStatus = useMemo(() => {
    if (loading || !dbUser || !user) return null;
    if (dbUser.friends?.includes(user.uid)) return 'friends';
    if (dbUser.friendRequestsSent?.includes(user.uid)) return 'sent';
    if (dbUser.friendRequestsReceived?.includes(user.uid)) return 'received';
    return null;
  }, [dbUser, user, loading]);

  const renderFriendButton = () => {
    if (isSubmitting || loading) {
      return <Button size="sm" className="w-full" disabled onClick={(e) => e.stopPropagation()}><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wait</Button>;
    }

    switch (friendStatus) {
      case 'friends':
        return <Button size="sm" variant="secondary" className="w-full" disabled onClick={(e) => e.stopPropagation()}><UserCheck className="mr-2 h-4 w-4" /> Friends</Button>;
      case 'sent':
        return <Button size="sm" variant="secondary" className="w-full" disabled onClick={(e) => e.stopPropagation()}>Request Sent</Button>;
      case 'received':
        return <Button size="sm" asChild className="w-full" onClick={(e) => e.stopPropagation()}><Link href="/friends">Respond</Link></Button>;
      default:
        return <Button size="sm" className="w-full" onClick={handleAddFriend}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>;
    }
  };
  
  if (variant === 'compact') {
    return (
       <Card className="flex flex-col text-center p-4 transition-all hover:shadow-lg h-full">
         <Link href={`/profile/${user._id.toString()}`} className="flex-grow">
            <Avatar className="w-20 h-20 mx-auto border-2 border-primary">
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-md mt-2 truncate w-full hover:underline">{user.name}</h3>
            <p className="text-xs text-muted-foreground truncate w-full">{user.major}</p>
          </Link>
          <div className="mt-4 w-full">
             {dbUser?.uid !== user.uid && renderFriendButton()}
          </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col items-center justify-center p-4 text-center h-full transition-all hover:shadow-lg hover:border-primary">
      <CardHeader className="p-2">
        <Link href={`/profile/${user._id.toString()}`}>
          <Avatar className="w-24 h-24 mx-auto border-4 border-primary">
            <AvatarImage src={user.photoUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
      </CardHeader>
      <CardContent className="p-2 space-y-2 flex-grow flex flex-col justify-center">
        <Link href={`/profile/${user._id.toString()}`}>
            <h3 className="font-bold text-lg hover:underline">{user.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{user.university}</p>
        <p className="text-xs text-muted-foreground">{user.major}</p>
      </CardContent>
      <div className="flex w-full gap-2 mt-auto pt-4">
        {dbUser?.uid !== user.uid && renderFriendButton()}
        { dbUser?.uid !== user.uid && dbUser?.friends?.includes(user.uid) && (
            <Button size="sm" variant="outline" className="flex-1" asChild>
                <Link href={`/messages/${[dbUser?.uid, user.uid].sort().join('_')}`}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                </Link>
            </Button>
        )}
      </div>
    </Card>
  );
}
