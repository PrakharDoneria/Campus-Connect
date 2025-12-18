
'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function PostCard({ post, isGuest = false }: { post: IPost; isGuest?: boolean }) {
  
  const timestamp = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 text-sm">
                <p className="font-semibold">{post.author.name}</p>
                <span className="text-muted-foreground">•</span>
                <Link href={`/c/${post.circle}`} className="text-muted-foreground hover:underline">
                    c/{post.circle}
                </Link>
            </div>
            <p className="text-sm text-muted-foreground">{post.author.university} • {timestamp}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className={cn("text-card-foreground whitespace-pre-wrap", isGuest && "blur-sm select-none")}>
          {post.content}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          <span>{post.likes.length}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
