'use client';

import { useAuth } from '@/hooks/use-auth';
import { PostCard } from '@/components/common/PostCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Post } from '@/types';
import { GraduationCap } from 'lucide-react';

const dummyPosts: Post[] = [
  {
    id: '1',
    author: {
      name: 'Alice Johnson',
      avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-1')?.imageUrl || '',
      university: 'State University',
    },
    timestamp: '2h ago',
    content: 'Just finished my mid-term exams! So glad to have some free time. Anyone up for a study group for finals?',
    imageUrl: PlaceHolderImages.find(p => p.id === 'post-image-1')?.imageUrl,
    likes: 15,
    comments: 4,
  },
  {
    id: '2',
    author: {
      name: 'Bob Williams',
      avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-2')?.imageUrl || '',
      university: 'State University',
    },
    timestamp: '5h ago',
    content: 'The new coffee shop on campus is amazing! Highly recommend the iced latte. #campuslife',
    likes: 32,
    comments: 8,
  },
  {
    id: '3',
    author: {
      name: 'Charlie Brown',
      avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-3')?.imageUrl || '',
      university: 'Tech Institute',
    },
    timestamp: '1d ago',
    content: 'Looking for a roommate for next semester. I am clean, quiet, and a computer science major. DM me if interested!',
    likes: 10,
    comments: 2,
  },
    {
    id: '4',
    author: {
      name: 'Diana Prince',
      avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-4')?.imageUrl || '',
      university: 'State University',
    },
    timestamp: '2d ago',
    content: 'Volleyball game tonight at the main field! Come and support our team. Go Tigers!',
    likes: 55,
    comments: 12,
  },
    {
    id: '5',
    author: {
      name: 'Ethan Hunt',
      avatarUrl: PlaceHolderImages.find(p => p.id === 'user-avatar-5')?.imageUrl || '',
      university: 'Arts College',
    },
    timestamp: '3d ago',
    content: 'Selling my old textbooks for a reasonable price. Mostly for first-year engineering students. Hit me up if you need any.',
    likes: 8,
    comments: 1,
  },
];


export default function FeedPage() {
  const { user, dbUser, signOut } = useAuth();
  const isGuest = !user;

  const postsToShow = isGuest ? dummyPosts.slice(0, 4) : dummyPosts;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campus Feed</h1>
        {user && (
            <button onClick={signOut} className="text-sm text-primary hover:underline">
            Sign Out
            </button>
        )}
      </div>

      <div className="space-y-6">
        {postsToShow.map((post) => (
          <PostCard key={post.id} post={post} isGuest={isGuest} />
        ))}
      </div>

       {isGuest && (
        <div className="text-center py-10 mt-6 bg-card rounded-lg shadow-md">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold">See What’s Happening</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            Log in to see more posts and connect with your campus community.
          </p>
          <Button asChild>
            <Link href="/">Login or Sign Up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
