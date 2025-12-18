
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart, Loader2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { toggleLikePost, updatePost, deletePost } from '@/lib/actions/post.actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '../ui/textarea';


interface PostCardProps {
  post: IPost;
  isGuest?: boolean;
  onPostUpdate?: (updatedPost: IPost) => void;
  onPostDelete?: (postId: string) => void;
}

export function PostCard({ post, isGuest = false, onPostUpdate, onPostDelete }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const timestamp = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const editedTimestamp = post.editedAt ? formatDistanceToNow(new Date(post.editedAt), { addSuffix: true }) : null;


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

  const handleDelete = async () => {
    if (!isAuthor) return;
    setIsDeleting(true);
    try {
      await deletePost(post._id.toString());
      toast({ title: 'Post Deleted', description: 'Your post has been sent to the void.' });
      if (onPostDelete) {
        onPostDelete(post._id.toString());
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast({ title: "Error", description: "Could not delete the post.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleUpdate = async () => {
    if (!isAuthor || !editedContent.trim()) return;
    setIsUpdating(true);
    try {
      const updatedPost = await updatePost(post._id.toString(), editedContent);
      toast({ title: 'Post Updated!', description: 'Your post has been successfully edited.' });
      if (onPostUpdate) {
        onPostUpdate(updatedPost);
      }
      setShowEditDialog(false);
    } catch (error) {
      console.error("Failed to update post:", error);
      toast({ title: "Error", description: "Could not update the post.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const isLikedByCurrentUser = user && post.likes.includes(user.uid);
  const isAuthor = user && post.author.uid === user.uid;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 text-sm">
                  <Link href={`/profile/${post.author.uid}`} className="font-semibold hover:underline">
                    {post.author.name}
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link href={`/c/${post.circle}`} className="text-muted-foreground hover:underline">
                      c/{post.circle}
                  </Link>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>{timestamp}</span>
                {post.editedAt && <span title={new Date(post.editedAt).toLocaleString()}>(edited {editedTimestamp})</span>}
              </div>
            </div>
             {isAuthor && (
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteAlert(true)}
                    >
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit your masterpiece</DialogTitle>
              <DialogDescription>
                Make changes to your post here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Textarea 
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[120px]"
            />
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isUpdating}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={isUpdating || editedContent.trim() === ''}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
