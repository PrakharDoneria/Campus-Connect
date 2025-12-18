'use client';

import { useEffect, useState } from 'react';
import { getNearbyUsers } from '@/lib/actions/user.actions';
import { IUser } from '@/types';
import { UserCard } from '@/components/common/UserCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NearbyPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dbUser } = useAuth();

  useEffect(() => {
    async function fetchUsers() {
      if (!dbUser || !dbUser.location) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const nearbyUsers = await getNearbyUsers({
          userId: dbUser._id.toString(),
          long: dbUser.location.coordinates[0],
          lat: dbUser.location.coordinates[1],
        });
        setUsers(nearbyUsers);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch nearby users.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [dbUser]);

  if (!dbUser?.location) {
    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Location Not Set!</AlertTitle>
                <AlertDescription>
                    You need to set your location in your profile to see nearby students.
                    <Button asChild variant="link">
                        <Link href="/profile">Go to Profile</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Students Near You</h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 text-destructive">
          <p>{error}</p>
        </div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map((user) => (
            <UserCard key={user._id.toString()} user={user} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p>No other students found nearby. Expand your search radius or check back later!</p>
        </div>
      )}
    </div>
  );
}
