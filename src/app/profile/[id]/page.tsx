
'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getUserById } from '@/lib/actions/user.actions';
import { getPosts } from '@/lib/actions/post.actions';
import { IUser, IPost } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, GraduationCap, MessageSquare, UserPlus, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/common/PostCard';

export default function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<IUser | null>(null);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);
        const fetchedUser = await getUserById(id);
        if (!fetchedUser) {
          notFound();
          return;
        }
        setUser(fetchedUser);

        const allPosts = await getPosts();
        const userPosts = allPosts.filter(post => post.author.uid === fetchedUser.uid);
        setPosts(userPosts);

      } catch (error) {
        console.error('Failed to fetch user data:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const isOwnProfile = currentUser?.uid === user?.uid;

  if (loading) {
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
        <div className="h-32 bg-muted/50" />
        <CardHeader className="flex flex-col items-center justify-center text-center -mt-16 sm:flex-row sm:justify-start sm:text-left sm:items-end sm:gap-4">
          <Avatar className="w-32 h-32 border-4 border-background">
            <AvatarImage src={user.photoUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="py-2">
            <h1 className="text-3xl font-bold mt-4 sm:mt-0">{user.name}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-muted-foreground mt-2">
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
          <div className="flex justify-center gap-2 mt-4 sm:ml-auto">
            {isOwnProfile ? (
              <Button asChild variant="outline">
                <Link href="/profile"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link>
              </Button>
            ) : (
              <>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" /> Follow
                </Button>
                <Button variant="outline" disabled>
                  <MessageSquare className="mr-2 h-4 w-4" /> Message
                </Button>
              </>
            )}
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="posts" className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="following" disabled>Following</TabsTrigger>
          <TabsTrigger value="followers" disabled>Followers</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4">
            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => <PostCard key={post._id.toString()} post={post} />)}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
                    <p>This user hasn't posted anything yet.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="following">
            <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
                <p>Not following anyone yet.</p>
            </div>
        </TabsContent>
         <TabsContent value="followers">
            <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
                <p>No followers yet.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
