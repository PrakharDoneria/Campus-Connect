
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { toggleLikePost } from '@/lib/actions/post.actions';

interface PostCardProps {
  post: IPost;
  isGuest?: boolean;
  onPostUpdate?: (updatedPost: IPost) => void;
}

export function PostCard({ post, isGuest = false, onPostUpdate }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  
  const timestamp = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const handleLike = async () => {
    if (isGuest || !user) {
      toast({ title: "Please log in", description: "You need to be logged in to like a post." });
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      const isNowLiked = await toggleLikePost(post._id.toString(), user.uid);
      
      const updatedLikes = isNowLiked
        ? [...post.likes, user.uid]
        : post.likes.filter(uid => uid !== user.uid);
      
      if(onPostUpdate) {
        onPostUpdate({ ...post, likes: updatedLikes });
      }

    } catch (error) {
      console.error("Failed to like post:", error);
      toast({ title: "Error", description: "Could not update like status.", variant: "destructive" });
    } finally {
      setIsLiking(false);
    }
  };

  const isLikedByCurrentUser = user && post.likes.includes(user.uid);

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
        <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLike} disabled={isLiking}>
          {isLiking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", isLikedByCurrentUser && "fill-red-500 text-red-500")} />}
          <span>{post.likes.length}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2" disabled>
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
