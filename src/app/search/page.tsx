
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { searchUsersByName } from '@/lib/actions/user.actions';
import { searchCircles, joinCircle, leaveCircle } from '@/lib/actions/circle.actions';
import { IUser, ICircle } from '@/types';
import { UserCard } from '@/components/common/UserCard';
import { Shimmer } from '@/components/common/Shimmer';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const { dbUser } = useAuth();
  const { toast } = useToast();
  
  const [userResults, setUserResults] = useState<IUser[]>([]);
  const [circleResults, setCircleResults] = useState<ICircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!query) {
        setLoading(false);
        setUserResults([]);
        setCircleResults([]);
        return;
    };

    const fetchResults = async () => {
      setLoading(true);
      try {
        const [users, circles] = await Promise.all([
          dbUser ? searchUsersByName(query, dbUser._id) : Promise.resolve([]),
          searchCircles(query)
        ]);
        setUserResults(users);
        setCircleResults(circles);
      } catch (error) {
        console.error("Failed to search:", error);
        setUserResults([]);
        setCircleResults([]);
        toast({ title: 'Error', description: 'Could not perform search.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, dbUser, toast]);

  const handleJoinOrLeave = async (circleName: string) => {
    if (!dbUser) {
        toast({ title: "Please login to join a circle", variant: "destructive" });
        return;
    }
    setIsJoining(prev => ({ ...prev, [circleName]: true }));
    const isMember = dbUser.joinedCircles?.includes(circleName);
    try {
        if (isMember) {
            await leaveCircle(dbUser.uid, circleName);
            toast({ title: `Left c/${circleName}` });
        } else {
            await joinCircle(dbUser.uid, circleName);
            toast({ title: `Successfully joined c/${circleName}` });
        }
        window.location.reload(); 
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsJoining(prev => ({ ...prev, [circleName]: false }));
    }
  };


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for: <span className="text-primary">{query}</span>
      </h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users ({userResults.length})</TabsTrigger>
          <TabsTrigger value="circles">Circles ({circleResults.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
           {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
              {[...Array(4)].map((_, i) => (
                <Shimmer key={i} className="h-64 w-full rounded-lg" />
              ))}
            </div>
          ) : userResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
              {userResults.map((user) => (
                <UserCard key={user._id.toString()} user={user} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground mt-4">
              <p>No users found matching your search. Try a different name!</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="circles">
           {loading ? (
            <div className="space-y-4 mt-4">
                <Shimmer className="h-24 w-full rounded-lg" />
                <Shimmer className="h-24 w-full rounded-lg" />
            </div>
          ) : circleResults.length > 0 ? (
            <div className="space-y-4 mt-4">
              {circleResults.map((circle) => {
                const isMember = dbUser?.joinedCircles?.includes(circle.name);
                return (
                    <Card key={circle._id.toString()}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <Link href={`/c/${circle.name}`} className="hover:underline">
                                    <h3 className="font-semibold text-lg">c/{circle.name}</h3>
                                </Link>
                                <p className="text-sm text-muted-foreground">{circle.description}</p>
                            </div>
                            {dbUser && (
                                <Button 
                                    onClick={() => handleJoinOrLeave(circle.name)} 
                                    disabled={isJoining[circle.name]} 
                                    variant={isMember ? 'outline' : 'default'}
                                >
                                    {isJoining[circle.name] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isMember ? 'Leave' : 'Join'}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground mt-4">
              <p>No circles found matching your search. Maybe you should create it!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function SearchPage() {
    return (
        <Suspense fallback={<SearchSkeleton />}>
            <SearchResults />
        </Suspense>
    )
}

function SearchSkeleton() {
    return (
         <div className="container mx-auto p-4">
            <Shimmer className="h-8 w-64 mb-6" />
            <Tabs defaultValue="users" className="w-full">
                 <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="circles">Circles</TabsTrigger>
                </TabsList>
                <TabsContent value="users">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                    {[...Array(4)].map((_, i) => (
                        <Shimmer key={i} className="h-64 w-full rounded-lg" />
                    ))}
                    </div>
                </TabsContent>
                 <TabsContent value="circles">
                    <div className="space-y-4 mt-4">
                        <Shimmer className="h-24 w-full rounded-lg" />
                        <Shimmer className="h-24 w-full rounded-lg" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
