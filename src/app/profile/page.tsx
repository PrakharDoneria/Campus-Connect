
'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { getPosts } from '@/lib/actions/post.actions';
import { IPost } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, GraduationCap, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/common/PostCard';

export default function OwnProfilePage() {
  const { dbUser, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // If auth is not loading and there's no dbUser, redirect or show not found
    if (!authLoading && !dbUser) {
        // This could be a redirect to login or a not found page.
        // For now, we'll use notFound() to indicate the profile doesn't exist for a non-logged-in user.
        router.push('/');
        return;
    }

    async function fetchData() {
      if (!dbUser) return;
      try {
        setLoading(true);
        const allPosts = await getPosts();
        const userPosts = allPosts.filter(post => post.author.uid === dbUser.uid);
        setPosts(userPosts);
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


  if (loading || authLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl space-y-8">
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-[50px] w-full" />
        <Skeleton className="h-[200px] w-full" />
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
        <div className="h-32 bg-muted/50" />
        <CardHeader className="flex flex-col items-center justify-center text-center -mt-16 sm:flex-row sm:justify-start sm:text-left sm:items-end sm:gap-4">
          <Avatar className="w-32 h-32 border-4 border-background">
            <AvatarImage src={dbUser.photoUrl} alt={dbUser.name} />
            <AvatarFallback>{dbUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="py-2">
            <h1 className="text-3xl font-bold mt-4 sm:mt-0">{dbUser.name}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-muted-foreground mt-2">
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
          <div className="flex justify-center gap-2 mt-4 sm:ml-auto">
            <Button asChild variant="outline">
              <Link href="/profile/edit"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="posts" className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="friends" asChild><Link href="/friends">Friends</Link></TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4">
            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => <PostCard key={post._id.toString()} post={post} onPostUpdate={handlePostUpdate} />)}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
                    <p>You haven't posted anything yet.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
