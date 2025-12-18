'use client';

import Link from 'next/link';
import { Button } from '../ui/button';
import { Github, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { GoogleIcon } from '../icons';

export default function LandingHeader() {
  const { user, loading, signInWithGitHub, signInWithGoogle, signOut } = useAuth();

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
              <>
                <Button asChild>
                  <Link href="/feed">Go to App</Link>
                </Button>
                <Button onClick={signOut} variant="ghost">Sign Out</Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={signInWithGoogle} variant="outline">
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
                <Button onClick={signInWithGitHub}>
                  <Github className="mr-2 h-4 w-4" />
                  Sign in with GitHub
                </Button>
              </div>
            ))}
        </nav>
      </div>
    </header>
  );
}
