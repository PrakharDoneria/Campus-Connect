
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { IPost, IUser, ICircle } from '@/types';
import { createPost } from '@/lib/actions/post.actions';
import { Loader2, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { createCircle } from '@/lib/actions/circle.actions';

interface CreatePostFormProps {
  user: IUser;
  circles: ICircle[];
  onPostCreated: (newPost: IPost) => void;
  onCircleCreated: (newCircle: ICircle) => void;
}

export function CreatePostForm({ user, circles, onPostCreated, onCircleCreated }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<string>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [isCreatingCircle, setIsCreatingCircle] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [isCircleDialogOpen, setIsCircleDialogOpen] = useState(false);


  const handleCreateCircle = async () => {
    if (!newCircleName.trim() || !newCircleDescription.trim()) {
        toast({ title: "Error", description: "Circle name and description cannot be empty.", variant: "destructive" });
        return;
    }

    setIsCreatingCircle(true);
    try {
        const newCircle = await createCircle({ name: newCircleName, description: newCircleDescription }, user.uid);
        onCircleCreated(newCircle);
        setSelectedCircle(newCircle.name);
        toast({ title: "Success", description: `Circle "c/${newCircle.name}" created.` });
        setNewCircleName('');
        setNewCircleDescription('');
        setIsCircleDialogOpen(false);
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsCreatingCircle(false);
    }
  }


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
     if (!selectedCircle) {
      toast({
        title: 'No circle selected',
        description: 'Please select a circle to post in.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await createPost(content, selectedCircle, user);
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
  
  const suggestedCircles = useMemo(() => {
    return circles.filter(c => user.joinedCircles?.includes(c.name) || c.name === 'general');
  }, [circles, user.joinedCircles]);


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
              className="min-h-[60px] flex-1 resize-none border-0 shadow-none focus-visible:ring-0 bg-card"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
               <Select onValueChange={setSelectedCircle} value={selectedCircle}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a circle" />
                </SelectTrigger>
                <SelectContent>
                  {suggestedCircles.length > 0 ? (
                    suggestedCircles.map(circle => (
                        <SelectItem key={circle.name} value={circle.name}>c/{circle.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="general">c/general</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Dialog open={isCircleDialogOpen} onOpenChange={setIsCircleDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Create new circle">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a new Circle</DialogTitle>
                        <DialogDescription>
                            Circles are communities where you can share and discuss topics.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="circle-name">Circle Name</Label>
                            <div className="flex items-center">
                                <span className="p-2 bg-muted rounded-l-md text-muted-foreground">c/</span>
                                <Input 
                                    id="circle-name" 
                                    value={newCircleName} 
                                    onChange={(e) => setNewCircleName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                    className="rounded-l-none"
                                />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="circle-description">Description</Label>
                            <Textarea 
                                id="circle-description"
                                value={newCircleDescription}
                                onChange={(e) => setNewCircleDescription(e.target.value)}
                                placeholder="What is this circle about?"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCircleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateCircle} disabled={isCreatingCircle}>
                            {isCreatingCircle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Circle
                        </Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Button type="submit" disabled={isSubmitting || content.trim().length === 0 || !selectedCircle}>
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
