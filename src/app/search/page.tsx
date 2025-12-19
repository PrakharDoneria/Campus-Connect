'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { searchUsersByName } from '@/lib/actions/user.actions';
import { IUser } from '@/types';
import { UserCard } from '@/components/common/UserCard';
import { Shimmer } from '@/components/common/Shimmer';
import { useAuth } from '@/hooks/use-auth';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const { dbUser } = useAuth();
  
  const [results, setResults] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query || !dbUser) {
        setLoading(false);
        setResults([]);
        return;
    };

    const fetchResults = async () => {
      setLoading(true);
      try {
        const users = await searchUsersByName(query, dbUser._id.toString());
        setResults(users);
      } catch (error) {
        console.error("Failed to search users:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, dbUser]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for: <span className="text-primary">{query}</span>
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Shimmer key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((user) => (
            <UserCard key={user._id.toString()} user={user} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p>No users found matching your search. Try a different name!</p>
        </div>
      )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <Shimmer key={i} className="h-64 w-full rounded-lg" />
            ))}
            </div>
        </div>
    )
}
