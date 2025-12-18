
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPostsByAuthor } from '@/lib/actions/post.actions';
import { getUsers } from '@/lib/actions/user.actions';
import { IUser, IPost } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shimmer } from '@/components/common/Shimmer';
import { Building, GraduationCap, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/common/PostCard';
import { FriendCard } from '@/components/common/FriendCard';

export default function OwnProfilePage() {
  const { dbUser, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [friends, setFriends] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // If auth is not loading and there's no dbUser, redirect or show not found
    if (!authLoading && !dbUser) {
        router.push('/');
        return;
    }

    async function fetchData() {
      if (!dbUser) return;
      try {
        setLoading(true);
        const [userPosts, userFriends] = await Promise.all([
          getPostsByAuthor(dbUser.uid),
          getUsers(dbUser.friends)
        ]);
        setPosts(userPosts);
        setFriends(userFriends);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (dbUser) {
        fetchData();
    }
  }, [dbUser, authLoading, router]);

  const handlePostUpdate = (updatedPost: IPost) => {
    setPosts(prevPosts => prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };
  
  const handlePostDelete = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
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

  if (!dbUser) {
    // This will be rendered briefly before the redirect in useEffect kicks in.
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card className="overflow-hidden">
        <div className="h-32 bg-muted" />
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 -mt-20">
            <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-background shrink-0">
              <AvatarImage src={dbUser.photoUrl} alt={dbUser.name} />
              <AvatarFallback className="text-4xl">{dbUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="mt-4 sm:mt-0 flex-grow">
              <h1 className="text-2xl sm:text-3xl font-bold">{dbUser.name}</h1>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{dbUser.university}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>{dbUser.major}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-start gap-2 mt-4 sm:ml-auto sm:self-end shrink-0">
              <Button asChild variant="outline">
                <Link href="/profile/edit"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="posts" className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4">
            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => <PostCard key={post._id.toString()} post={post} onPostUpdate={handlePostUpdate} onPostDelete={handlePostDelete} />)}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
                    <p>Your post history is looking a little empty. Time to share something!</p>
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
                    <p>This is where your friends would be... IF YOU HAD ANY!</p>
                     <Button variant="link" asChild><Link href="/nearby">Find Some Friends</Link></Button>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
