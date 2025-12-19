
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getNearbyUsers, getRandomUsers, inferUserInteractionPreference } from '@/lib/actions/user.actions';
import { IUser, Gender } from '@/types';
import { UserCard } from '@/components/common/UserCard';
import { Shimmer } from '@/components/common/Shimmer';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}


export default function NearbyPage() {
  const { dbUser } = useAuth();
  const [nearbyUsers, setNearbyUsers] = useState<IUser[]>([]);
  const [randomUsers, setRandomUsers] = useState<IUser[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [loadingRandom, setLoadingRandom] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(50); // Default radius in km
  
  const fetchNearby = useCallback(async (searchRadius: number) => {
    if (!dbUser || !dbUser.location) {
      setLoadingNearby(false);
      return;
    }
    
    try {
      setLoadingNearby(true);
      setError(null);
      const fetchedUsers = await getNearbyUsers({
        userId: dbUser._id.toString(),
        long: dbUser.location.coordinates[0],
        lat: dbUser.location.coordinates[1],
        maxDistance: searchRadius * 1000, // convert km to meters
      });
      setNearbyUsers(fetchedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nearby users.');
      console.error(err);
    } finally {
      setLoadingNearby(false);
    }
  }, [dbUser]);

  const fetchRandom = useCallback(async () => {
    if (!dbUser) {
        setLoadingRandom(false);
        return;
    }
    try {
        setLoadingRandom(true);
        setError(null);
        
        // Infer preference first
        const inferredPreference = await inferUserInteractionPreference(dbUser.uid);
        
        const fetchedUsers = await getRandomUsers({
            currentUserId: dbUser._id.toString(),
            preference: inferredPreference,
        });
        setRandomUsers(fetchedUsers);
    } catch(err: any) {
        setError(err.message || 'Failed to fetch random users.');
        console.error(err);
    } finally {
        setLoadingRandom(false);
    }
  }, [dbUser]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchNearby = useMemo(() => debounce(fetchNearby, 500), [fetchNearby]);

  useEffect(() => {
    if (dbUser?.location) {
      fetchNearby(radius);
    } else {
      setLoadingNearby(false);
    }
    if (dbUser) {
        fetchRandom();
    } else {
        setLoadingRandom(false);
    }
  }, [dbUser, fetchNearby, fetchRandom, radius]);

  const handleSliderChange = (value: number[]) => {
    const newRadius = value[0];
    setRadius(newRadius);
    debouncedFetchNearby(newRadius);
  };

  const renderUserGrid = (users: IUser[], loading: boolean, emptyMessage: string) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {[...Array(8)].map((_, i) => (
            <Shimmer key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      );
    }
    if (error) {
        return (
            <div className="text-center py-10 text-destructive">
            <p>{error}</p>
            </div>
        );
    }
    if (users.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground mt-6">
          <p>{emptyMessage}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
        {users.map((user) => (
          <UserCard key={user._id.toString()} user={user} />
        ))}
      </div>
    );
  };

  if (!dbUser?.location) {
    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Location Not Set!</AlertTitle>
                <AlertDescription>
                    To see nearby students, you need to set your location. This will also improve random recommendations.
                    <Button asChild variant="link">
                        <Link href="/profile/edit">Go to Profile</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Discover Students</h1>
        <Tabs defaultValue="nearby">
            <TabsList>
                <TabsTrigger value="nearby">Nearby</TabsTrigger>
                <TabsTrigger value="random">For You</TabsTrigger>
            </TabsList>
            <TabsContent value="nearby">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 mb-6 gap-4">
                    <div className="w-full md:w-64 space-y-2">
                        <div className='flex justify-between'>
                            <Label htmlFor="radius-slider">Search Radius</Label>
                            <span className="text-sm font-medium">{radius} km</span>
                        </div>
                        <Slider
                            id="radius-slider"
                            min={5}
                            max={100}
                            step={5}
                            value={[radius]}
                            onValueChange={handleSliderChange}
                        />
                    </div>
                </div>
                {renderUserGrid(nearbyUsers, loadingNearby, "Are you on a remote island? No one's nearby. Try expanding your search radius!")}
            </TabsContent>
            <TabsContent value="random">
                 <div className="flex justify-between items-center mt-6 mb-6">
                    <p className="text-sm text-muted-foreground">Random profiles suggested based on your interactions.</p>
                     <Button variant="outline" onClick={fetchRandom} disabled={loadingRandom}>
                        {loadingRandom ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </Button>
                </div>
                {renderUserGrid(randomUsers, loadingRandom, "Couldn't find anyone right now. Try interacting with more people!")}
            </TabsContent>
        </Tabs>
    </div>
  );
}

    