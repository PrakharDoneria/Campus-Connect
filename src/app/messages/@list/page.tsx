
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
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


interface ConversationWithLastMessage extends IUser {
  lastMessage: IMessage | null;
}

export default function MessagesPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!dbUser) return;

    let unsubscribers: (() => void)[] = [];

    const fetchConversations = async () => {
        setLoading(true);
        const friendUsers = await getUsers(dbUser.friends);
        
        const conversationsWithLastMessagePromises = friendUsers.map(async (friend) => {
          return new Promise<ConversationWithLastMessage>((resolve) => {
            const conversationId = [dbUser.uid, friend.uid].sort().join('_');
            const messagesCollection = collection(firestore, 'messages');
            const q = query(
              messagesCollection,
              where('conversationId', '==', conversationId),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
    
            const unsubscribe = onSnapshot(q, (snapshot) => {
              const lastMessage = snapshot.empty
                ? null
                : {
                    _id: snapshot.docs[0].id,
                    ...snapshot.docs[0].data(),
                    createdAt: snapshot.docs[0].data().createdAt?.toDate() ?? new Date(),
                  } as IMessage;
    
              setConversations(prev => {
                const existingConvo = prev.find(c => c.uid === friend.uid);
                let newConversations;
                if (existingConvo) {
                  newConversations = prev.map(c =>
                    c.uid === friend.uid ? { ...c, lastMessage } : c
                  );
                } else {
                  newConversations = [...prev, { ...friend, lastMessage }];
                }
                
                newConversations.sort((a, b) => {
                    const dateA = a.lastMessage?.createdAt ?? 0;
                    const dateB = b.lastMessage?.createdAt ?? 0;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                });

                return newConversations;
              });
              resolve({ ...friend, lastMessage });
            }, (error) => {
              console.warn(`Error fetching last message for ${friend.name}. This may be due to missing Firestore indexes. The app will function but conversation ordering may not be real-time.`, error.message);
              resolve({ ...friend, lastMessage: null });
            });
            unsubscribers.push(unsubscribe);
          });
        });

        await Promise.all(conversationsWithLastMessagePromises);
        
        setLoading(false);
    };

    fetchConversations();
    
    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
}, [dbUser]);


    const handleDeleteConversation = async () => {
        if (!conversationToDelete || !dbUser) return;
        
        setIsDeleting(true);
        try {
            await deleteConversation(conversationToDelete);
            setConversations(prev => prev.filter(c => [c.uid, dbUser.uid].sort().join('_') !== conversationToDelete));
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
      return conversations.filter(convo => convo.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [conversations, searchTerm]);

  if (loading || authLoading) {
    return (
        <div className="col-span-1 h-full">
            <Shimmer className="h-full w-full" />
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
              {filteredConversations.map(convoUser => {
                const conversationId = dbUser ? [dbUser.uid, convoUser.uid].sort().join('_') : '';
                const isActive = pathname === `/messages/${conversationId}`;
                const isUnread = convoUser.lastMessage?.read === false && convoUser.lastMessage?.to === dbUser?.uid;

                return (
                <div key={convoUser.uid} className="group relative">
                    <Link
                    href={`/messages/${conversationId}`}
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
                            setConversationToDelete(conversationId);
                            setShowDeleteAlert(true);
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
              )})}
               {conversations.length === 0 && (
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
