'use client';

import { useAuth } from '@/hooks/use-auth';

export default function FeedPage() {
  const { user, dbUser, signOut } = useAuth();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campus Feed</h1>
        <button onClick={signOut} className="text-sm text-primary hover:underline">
          Sign Out
        </button>
      </div>

      {user && (
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Welcome, {dbUser?.name || user.displayName}!</h2>
          <p className="text-muted-foreground">This is your campus feed. More content coming soon!</p>
          <pre className="mt-4 bg-muted p-4 rounded-md text-sm overflow-auto">
            <code>{JSON.stringify({ firebaseUser: user, databaseUser: dbUser }, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
