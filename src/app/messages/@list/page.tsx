
'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Search, Loader2, Video, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUser, getUsers } from '@/lib/actions/user.actions';
import { sendMessage, markConversationAsRead, deleteMessage, deleteConversation } from '@/lib/actions/message.actions';
import { IUser, IMessage } from '@/types';
import Link from 'next/link';
import { Shimmer } from '@/components/common/Shimmer';
import { cn } from '@/lib/utils';
import { collection, query, where, onSnapshot, orderBy, limit, or } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


interface ConversationWithDetails extends IUser {
  lastMessage: IMessage | null;
  conversationId: string;
}

export default function MessagesPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load initial data from cache
  useEffect(() => {
    if (!dbUser) return;
    try {
      const cacheKey = `conversationsCache_${dbUser.uid}`;
      const cachedConversations = localStorage.getItem(cacheKey);
      if (cachedConversations) {
        const parsed = JSON.parse(cachedConversations);
        if (Array.isArray(parsed) && parsed.length > 0) {
            setConversations(parsed);
            setLoading(false); // We have something to show, so reduce initial loading state
        }
      }
    } catch (error) {
      console.error("Failed to load conversations from cache", error);
    }
  }, [dbUser]);


  useEffect(() => {
    if (!dbUser || !dbUser.friends || dbUser.friends.length === 0) {
      setLoading(false);
      return;
    }
    
    // If we loaded from cache, we don't need the global shimmer
    if (!loading) setLoading(false);
    else setLoading(true);

    let unsubscribe: (() => void) | null = null;
    
    const setupListener = async () => {
        const friendDetails = await getUsers(dbUser.friends);
        const friendMap = new Map(friendDetails.map(f => [f.uid, f]));
        
        const conversationIds = dbUser.friends.map(friendUid => {
            return [dbUser.uid, friendUid].sort().join('_');
        });

        if (conversationIds.length === 0) {
            setLoading(false);
            setConversations([]);
            return;
        }

        const messagesCollection = collection(firestore, 'messages');
        const q = query(
            messagesCollection,
            where('conversationId', 'in', conversationIds)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesByConvo: Record<string, IMessage[]> = {};
            snapshot.forEach(doc => {
                const msg = { 
                    _id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() ?? new Date(),
                } as IMessage;
                if (!messagesByConvo[msg.conversationId]) {
                    messagesByConvo[msg.conversationId] = [];
                }
                messagesByConvo[msg.conversationId].push(msg);
            });

            const updatedConversations: ConversationWithDetails[] = [];
            for (const friendUid of dbUser.friends) {
                const friend = friendMap.get(friendUid);
                if (friend) {
                    const convoId = [dbUser.uid, friendUid].sort().join('_');
                    const convoMessages = messagesByConvo[convoId] || [];
                    convoMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    
                    updatedConversations.push({
                        ...friend,
                        conversationId: convoId,
                        lastMessage: convoMessages[0] || null,
                    });
                }
            }
            
            updatedConversations.sort((a, b) => {
                const dateA = a.lastMessage?.createdAt ?? 0;
                const dateB = b.lastMessage?.createdAt ?? 0;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });

            setConversations(updatedConversations);
            setLoading(false);
            
            // Update cache
            try {
              const cacheKey = `conversationsCache_${dbUser.uid}`;
              localStorage.setItem(cacheKey, JSON.stringify(updatedConversations));
            } catch (error) {
              console.error("Failed to update conversations cache", error);
            }

        }, (error) => {
            console.error("Error with messages snapshot:", error);
            toast({ title: 'Error', description: 'Could not sync messages.', variant: 'destructive'});
            setLoading(false);
        });
    };

    setupListener();

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
}, [dbUser, toast, loading]);


    const handleDeleteConversation = async () => {
        if (!conversationToDelete || !dbUser) return;
        
        setIsDeleting(true);
        try {
            await deleteConversation(conversationToDelete);
            setConversations(prev => prev.filter(c => c.conversationId !== conversationToDelete));
            toast({ title: 'Success', description: 'Conversation deleted.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete conversation.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setConversationToDelete(null);
            setShowDeleteAlert(false);
        }
    };

  const filteredConversations = useMemo(() => {
      if (!searchTerm) return conversations;
      return conversations.filter(convo => convo.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [conversations, searchTerm]);

  if (loading || authLoading) {
    return (
        <div className="col-span-1 h-full">
            <div className="p-4 border-b">
                <Shimmer className="h-8 w-32 mb-4" />
                <Shimmer className="h-10 w-full" />
            </div>
            <div className="flex-1 p-4 space-y-4">
                <Shimmer className="h-16 w-full" />
                <Shimmer className="h-16 w-full" />
                <Shimmer className="h-16 w-full" />
            </div>
        </div>
    )
  }

  return (
    <>
        <div className="col-span-1 flex flex-col border-r bg-background h-full">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Messages</h2>
             <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search friends..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="flex flex-col">
              {filteredConversations.length > 0 ? (
                filteredConversations.map(convoUser => {
                    const isActive = pathname === `/messages/${convoUser.conversationId}`;
                    const isUnread = convoUser.lastMessage?.read === false && convoUser.lastMessage?.to === dbUser?.uid;

                    return (
                    <div key={convoUser.uid} className="group relative">
                        <Link
                        href={`/messages/${convoUser.conversationId}`}
                        className={cn(
                            "flex items-center gap-3 p-4 text-muted-foreground transition-all border-b",
                            isActive ? "bg-muted/50" : "hover:bg-muted/50",
                            isUnread && "bg-primary/10"
                        )}
                        >
                        <Avatar className={cn("h-12 w-12 border-2", isUnread ? "border-primary" : "border-transparent")}>
                            <AvatarImage src={convoUser.photoUrl} alt={convoUser.name} />
                            <AvatarFallback>{convoUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center">
                                <span className={cn("font-semibold truncate text-foreground", isUnread && "font-bold")}>{convoUser.name}</span>
                                {convoUser.lastMessage?.createdAt && (
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(convoUser.lastMessage.createdAt), { addSuffix: true })}
                                    </span>
                                )}
                            </div>
                            <p className={cn("text-sm truncate", isUnread ? "text-foreground" : "text-muted-foreground")}>
                                {convoUser.lastMessage?.from === dbUser?.uid && "You: "}{convoUser.lastMessage?.text}
                            </p>
                        </div>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setConversationToDelete(convoUser.conversationId);
                                setShowDeleteAlert(true);
                            }}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  )})
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">
                    No conversations yet. Go make some friends!
                </p>
              )}
            </nav>
          </div>
        </div>

     <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entire conversation for both you and the other user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
