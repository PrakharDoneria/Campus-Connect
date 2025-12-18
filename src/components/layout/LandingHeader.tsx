'use client';

import Link from 'next/link';
import { Button } from '../ui/button';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function LandingHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span>Campus Connect</span>
        </Link>
        <nav className="flex items-center gap-4">
          {!loading &&
            (user ? (
              <Button asChild>
                <Link href="/feed">Go to App</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            ))}
        </nav>
      </div>
    </header>
  );
}
