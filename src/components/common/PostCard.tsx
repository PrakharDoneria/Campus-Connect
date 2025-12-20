
'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Heart, Loader2, MoreHorizontal, Send, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPost, IComment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { toggleLikePost, updatePost, deletePost } from '@/lib/actions/post.actions';
import { createComment, getCommentsByPost } from '@/lib/actions/comment.actions';
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
import { Separator } from '../ui/separator';
import Image from 'next/image';

interface PostCardProps {
  post: IPost;
  isGuest?: boolean;
  onPostUpdate?: (updatedPost: IPost) => void;
  onPostDelete?: (postId: string) => void;
}

export function PostCard({ post, isGuest = false, onPostUpdate, onPostDelete }: PostCardProps) {
  const { user, dbUser } = useAuth();
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const timestamp = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const editedTimestamp = post.editedAt ? formatDistanceToNow(new Date(post.editedAt), { addSuffix: true }) : null;

  useEffect(() => {
    // Only fetch comments if there are any and they haven't been fetched yet
    if (showComments && Array.isArray(post.comments) && post.comments.length > 0 && !commentsFetched) {
      const fetchComments = async () => {
        setIsLoadingComments(true);
        try {
          const fetchedComments = await getCommentsByPost(post._id.toString());
          setComments(fetchedComments);
          setCommentsFetched(true);
        } catch (error) {
          toast({ title: 'Error', description: 'Could not fetch comments.' });
        } finally {
          setIsLoadingComments(false);
        }
      };
      fetchComments();
    }
  }, [post._id, post.comments, commentsFetched, toast, showComments]);


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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !dbUser) {
        return;
    }
    setIsCommenting(true);
    try {
        const createdComment = await createComment(post._id.toString(), newComment, dbUser);
        setComments(prev => [createdComment, ...prev]);
        setNewComment('');
        toast({ title: 'Comment posted!' });
         if (onPostUpdate) {
            onPostUpdate({ ...post, comments: [...post.comments, createdComment._id.toString()] });
        }
    } catch (error) {
        toast({ title: 'Error', description: 'Could not post comment.', variant: 'destructive' });
    } finally {
        setIsCommenting(false);
    }
  };

  const renderContentWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      }
      return part;
    });
  };


  const isLikedByCurrentUser = user && post.likes.includes(user.uid);
  const isAuthor = user && post.author.uid === user.uid;
  const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;

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
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => {
                      setShowEditDialog(true);
                      setIsMenuOpen(false);
                    }}>
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => {
                        setShowDeleteAlert(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {post.content && (
            <p className={cn("text-card-foreground whitespace-pre-wrap", isGuest && "blur-sm select-none")}>
              {renderContentWithLinks(post.content)}
            </p>
          )}
          {post.imageUrl && (
             <div className={cn("relative mt-4 aspect-video w-full overflow-hidden rounded-lg", isGuest && "blur-sm select-none")}>
                <Image src={post.imageUrl} alt="Post image" fill className="object-cover" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLike} disabled={isLiking}>
            {isLiking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", isLikedByCurrentUser && "fill-red-500 text-red-500")} />}
            <span>{post.likes.length}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setShowComments(!showComments)}>
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount}</span>
          </Button>
        </CardFooter>
        
        {showComments && (
          <div className="p-4 pt-0">
            <Separator className="mb-4" />
            {dbUser && (
                <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mb-4">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={dbUser.photoUrl} alt={dbUser.name} />
                        <AvatarFallback>{dbUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Input 
                        placeholder="Write a comment..." 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        disabled={isCommenting}
                    />
                    <Button type="submit" size="icon" disabled={isCommenting || !newComment.trim()}>
                        {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            )}

            {isLoadingComments ? (
                <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {comments.map(comment => (
                    <div key={comment._id.toString()} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
                            <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-sm bg-muted rounded-lg p-2">
                            <div className="flex items-baseline gap-2">
                                <Link href={`/profile/${comment.author.uid}`} className="font-semibold hover:underline">
                                    {comment.author.name}
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <p>{comment.content}</p>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <p className="text-center text-sm text-muted-foreground py-4">No comments yet. Be the first to comment!</p>
            )}
          </div>
        )}
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
