
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { IPost, IUser } from '@/types';
import { createPost } from '@/lib/actions/post.actions';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface CreatePostFormProps {
  user: IUser;
  onPostCreated: (newPost: IPost) => void;
}

export function CreatePostForm({ user, onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 3) {
      toast({
        title: 'Post is too short',
        description: 'Your post must be at least 3 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await createPost(content, user);
      toast({
        title: 'Post Created!',
        description: 'Your post is now live on the feed.',
      });
      setContent('');
      onPostCreated(newPost);
    } catch (error) {
      console.error('Failed to create post:', error);
      toast({
        title: 'Error',
        description: 'Could not create your post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening on campus?"
              className="min-h-[60px] flex-1 resize-none border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || content.trim().length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
