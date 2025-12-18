'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { getUserById } from '@/lib/actions/user.actions';
import { IUser } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, GraduationCap, MessageSquare, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = params;

  useEffect(() => {
    async function fetchUser() {
      try {
        const fetchedUser = await getUserById(id);
        if (!fetchedUser) {
          notFound();
        }
        setUser(fetchedUser);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id]);

  const isOwnProfile = currentUser?.uid === user?.uid;

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Skeleton className="h-[400px] w-full" />
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
        <CardHeader className="flex flex-col items-center justify-center text-center -mt-16">
          <Avatar className="w-32 h-32 border-4 border-background">
            <AvatarImage src={user.photoUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold mt-4">{user.name}</h1>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>{user.university}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span>{user.major}</span>
              </div>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {isOwnProfile ? (
              <Button asChild>
                <Link href="/profile">Edit Profile</Link>
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
        </CardContent>
      </Card>
      
      {/* Placeholder for user's posts */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Posts</h2>
        <div className="text-center py-10 text-muted-foreground border rounded-lg">
            <p>This user hasn't posted anything yet.</p>
        </div>
      </div>
    </div>
  );
}
