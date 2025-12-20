import { Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '404 - Page Not Found | Campus Connect',
    description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4">
      <Map className="w-24 h-24 text-primary animate-pulse" />
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight font-headline sm:text-5xl">
        404 - Lost on Campus?
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        It seems you've taken a wrong turn. This page must have graduated or transferred to another university. Let's get you back to familiar territory.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href="/feed">Go to Feed</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back Home</Link>
        </Button>
      </div>
    </div>
  );
}
