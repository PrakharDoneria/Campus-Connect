
'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { getUser, sendFriendRequest, getUsers, blockUser } from '@/lib/actions/user.actions';
import { getPostsByAuthor } from '@/lib/actions/post.actions';
import { IUser, IPost } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shimmer } from '@/components/common/Shimmer';
import { Building, GraduationCap, MessageSquare, UserPlus, Edit, Loader2, UserCheck, MoreVertical, ShieldBan, Github, Linkedin, Facebook } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/common/PostCard';
import { useToast } from '@/hooks/use-toast';
import { FriendCard } from '@/components/common/FriendCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

function InstagramIcon(props: any) {
    return (
        <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
    )
}

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
        // It could be a UID or a Mongo _id
        const fetchedUser = await getUser(id);
        if (!fetchedUser) {
          notFound();
          return;
        }
        setUser(fetchedUser);

        const [userPosts, userFriends] = await Promise.all([
            getPostsByAuthor(fetchedUser.uid),
            getUsers(fetchedUser.friends || [])
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
  
  const handlePostDelete = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
  };


  const isOwnProfile = currentUser?.uid === user?.uid;

  const handleAddFriend = async () => {
    if (!dbUser || !user) return;
    setIsSubmitting(true);
    try {
      await sendFriendRequest(dbUser.uid, user.uid);
      toast({ title: "Request Sent!", description: `Friend request sent to ${user.name}. They'll be so thrilled.` });
       // Manually update the state to give instant feedback
      const updatedUser = { ...user, friendRequestsReceived: [...(user.friendRequestsReceived || []), dbUser.uid] };
      setUser(updatedUser);
      router.refresh();
    } catch (error) {
      toast({ title: "Error", description: "Could not send friend request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockUser = async () => {
    if (!dbUser || !user) return;
    setIsSubmitting(true);
    try {
      await blockUser(dbUser.uid, user.uid);
      toast({ title: "User Blocked", description: `You have blocked ${user.name}.`, variant: "destructive" });
      router.push('/feed'); // Redirect after blocking
    } catch (error) {
      toast({ title: "Error", description: "Could not block user.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const getFriendStatus = () => {
    if (authLoading || !dbUser || !user) return null;
    if (dbUser.blockedUsers?.includes(user.uid)) return 'blocked';
    if (dbUser.friends?.includes(user.uid)) return 'friends';
    if (dbUser.friendRequestsSent?.includes(user.uid)) return 'sent';
    if (user.friendRequestsSent?.includes(dbUser.uid)) return 'received'; // Check if the other user sent a request to me
    return null;
  };
  
  const friendStatus = getFriendStatus();

  const renderFriendButton = () => {
    if (isSubmitting) {
        return <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Please Wait</Button>
    }

    switch (friendStatus) {
        case 'blocked':
            return <Button disabled variant="destructive"><ShieldBan className="mr-2 h-4 w-4" /> Blocked</Button>;
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
        <Shimmer className="h-[250px] w-full" />
        <Shimmer className="h-[50px] w-full" />
        <Shimmer className="h-[200px] w-full" />
      </div>
    );
  }

  if (!user || dbUser?.blockedUsers?.includes(user.uid)) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card className="overflow-hidden">
        <div className="h-32 bg-muted" />
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 -mt-20">
            <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-background shrink-0">
               <Link href={`/profile/${user._id.toString()}`}>
                <AvatarImage src={user.photoUrl} alt={user.name} />
                <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
              </Link>
            </Avatar>
            <div className="mt-4 sm:mt-0 flex-grow">
               <Link href={`/profile/${user._id.toString()}`}>
                <h1 className="text-2xl sm:text-3xl font-bold hover:underline">{user.name}</h1>
              </Link>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{user.university}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>{user.major}</span>
                </div>
                {user.universityCircle && (
                    <Link href={`/c/${user.universityCircle}`}>
                        <Badge variant="secondary">c/{user.universityCircle}</Badge>
                    </Link>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {user.socials?.github && (
                    <a href={`https://${user.socials.github}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon"><Github /></Button></a>
                )}
                {user.socials?.linkedin && (
                    <a href={`https://${user.socials.linkedin}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon"><Linkedin /></Button></a>
                )}
                {user.socials?.instagram && (
                    <a href={`https://${user.socials.instagram}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon"><InstagramIcon /></Button></a>
                )}
                {user.socials?.facebook && (
                    <a href={`https://${user.socials.facebook}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon"><Facebook /></Button></a>
                )}
              </div>
            </div>
            <div className="flex w-full sm:w-auto justify-start gap-2 mt-4 sm:ml-auto sm:self-end shrink-0">
              {isOwnProfile ? (
                <Button asChild variant="outline" className="flex-1 sm:flex-initial">
                  <Link href="/profile/edit"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link>
                </Button>
              ) : (
                <>
                  {renderFriendButton()}
                  <Button variant="outline" asChild disabled={friendStatus !== 'friends'} className="flex-1 sm:flex-initial">
                    <Link href={`/messages/${[dbUser?.uid, user.uid].sort().join('_')}`} onClick={e => e.stopPropagation()}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={handleBlockUser} className="text-destructive">
                        <ShieldBan className="mr-2 h-4 w-4" />
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    {posts.map(post => <PostCard key={post._id.toString()} post={post} isGuest={!currentUser} onPostUpdate={handlePostUpdate} onPostDelete={handlePostDelete} />)}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
                    <p>This user is a professional lurker. Not a single post in sight.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="friends" className="mt-4">
             {friends.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {friends.map(friend => <FriendCard key={friend.uid} user={friend} />)}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
                    <p>A lone wolf! This user hasn't added any friends yet.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
