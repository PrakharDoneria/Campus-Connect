import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post } from '@/types';


export function PostCard({ post, isGuest = false }: { post: Post; isGuest?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.author.name}</p>
            <p className="text-sm text-muted-foreground">{post.author.university} • {post.timestamp}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className={cn("text-card-foreground", isGuest && "blur-sm select-none")}>
          {post.content}
        </p>
        {post.imageUrl && (
          <div className="mt-4 relative h-64 w-full overflow-hidden rounded-lg">
            <Image 
              src={post.imageUrl} 
              alt="Post image" 
              fill 
              className={cn("object-cover", isGuest && "blur-lg filter grayscale")} 
              data-ai-hint="college event"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          <span>{post.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
