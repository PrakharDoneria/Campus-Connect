'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { GraduationCap, Users, Compass, Github } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from '@/hooks/use-auth';
import { GoogleIcon } from '@/components/icons';


export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-students');
  const { user, signInWithGoogle, signInWithGitHub } = useAuth();

  const features = [
    {
      icon: <GraduationCap className="h-10 w-10 text-primary" />,
      title: 'Exclusive to Students',
      description: 'Sign up to join a verified community of college students from your campus and beyond.',
    },
    {
      icon: <Compass className="h-10 w-10 text-primary" />,
      title: 'Discover Nearby Peers',
      description: 'Find and connect with students who share your interests, major, or are just around the corner.',
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'Vibrant Campus Feed',
      description: 'Stay updated with a campus-specific feed for posts, events, and announcements. Share your moments!',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col items-start justify-center space-y-6">
                <h1 className="text-4xl font-extrabold tracking-tight font-headline sm:text-5xl md:text-6xl lg:text-7xl">
                  Connect Your Campus.
                  <br />
                  <span className="text-primary">Instantly.</span>
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
                  The exclusive social network for college students. Discover peers, share updates, and build your community, one connection at a time.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  {user ? (
                      <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link href="/feed">Go to Feed</Link>
                      </Button>
                    ) : (
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">Join Now</Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-lg data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-[100%] data-[state=open]:duration-500 ease-out">
                          <SheetHeader className="text-center">
                            <SheetTitle>Join Campus Connect</SheetTitle>
                            <SheetDescription>
                              Sign in or create an account to connect with your campus.
                            </SheetDescription>
                          </SheetHeader>
                          <div className="flex flex-col gap-4 p-4 items-center">
                            <Button onClick={signInWithGoogle} variant="outline" className="w-full max-w-xs">
                              <GoogleIcon className="mr-2 h-4 w-4" />
                              Sign in with Google
                            </Button>
                            <Button onClick={signInWithGitHub} className="w-full max-w-xs">
                              <Github className="mr-2 h-4 w-4" />
                              Sign in with GitHub
                            </Button>
                          </div>
                        </SheetContent>
                      </Sheet>
                  )}
                  <Button asChild size="lg" variant="outline">
                    <Link href="/feed">View the Feed</Link>
                  </Button>
                </div>
              </div>
              <div className="relative h-64 w-full overflow-hidden rounded-xl shadow-2xl lg:h-auto">
                {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={heroImage.imageHint}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full bg-card py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                Features Built for Students
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to feel more connected on campus.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center space-y-4 text-center">
                  <div className="rounded-full bg-background p-4 shadow-md">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold font-headline">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 md:px-6">
          <p className="text-sm text-muted-foreground">&copy; 2025-26 Campus Connect. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/contribute" className="text-sm hover:text-primary">
              Contribute
            </Link>
            <Link href="#" className="text-sm hover:text-primary">
              Privacy
            </Link>
            <Link href="#" className="text-sm hover:text-primary">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
