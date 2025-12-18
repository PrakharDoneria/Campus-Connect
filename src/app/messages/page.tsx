
'use client';

import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const { dbUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const chatWithUserUid = searchParams.get('with');

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

        const initialConversations = await Promise.all(conversationsWithLastMessagePromises);
        
        if (chatWithUserUid) {
            let chatUser = friendUsers.find(f => f.uid === chatWithUserUid);
            if (!chatUser) {
                chatUser = await getUser(chatWithUserUid);
            }
            if (chatUser) {
                setActiveConversation(chatUser);
                 if (!initialConversations.some(f => f.uid === chatUser.uid)) {
                    setConversations(prev => [{...chatUser, lastMessage: null}, ...prev]);
                }
            }
        } else if (initialConversations.length > 0) {
            setActiveConversation(initialConversations.sort((a, b) => {
                const dateA = a.lastMessage?.createdAt ?? 0;
                const dateB = b.lastMessage?.createdAt ?? 0;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            })[0]);
        }

        setLoading(false);
    };

    fetchConversations();
    
    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
}, [dbUser, chatWithUserUid]);
  
  const conversationId = useMemo(() => {
    if (!dbUser || !activeConversation) return null;
    return [dbUser.uid, activeConversation.uid].sort().join('_');
  }, [dbUser, activeConversation]);


  useEffect(() => {
    if (!conversationId || !dbUser) {
        setMessages([]);
        return;
    };

    markConversationAsRead(conversationId, dbUser.uid);

    const messagesCollection = collection(firestore, 'messages');
    const q = query(
        messagesCollection, 
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages: IMessage[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            newMessages.push({
                _id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            } as IMessage);
        });
        setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [conversationId, dbUser]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent, content?: string) => {
    e.preventDefault();
    const textToSend = content || newMessage;
    if (!textToSend.trim() || !dbUser || !activeConversation) return;

    const optimisticNewMessage = textToSend;
    setNewMessage(''); 

    try {
        await sendMessage(dbUser.uid, activeConversation.uid, optimisticNewMessage);
    } catch (error) {
        console.error('Failed to send message:', error);
        setNewMessage(optimisticNewMessage); 
        toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    }
  }

    const handleDeleteMessage = async (messageId: string) => {
        const originalMessages = messages;
        setMessages(messages.filter(m => m._id !== messageId));
        try {
            await deleteMessage(messageId);
        } catch (error) {
            setMessages(originalMessages);
            toast({ title: 'Error', description: 'Failed to delete message.', variant: 'destructive' });
        }
    };

    const handleDeleteConversation = async () => {
        if (!conversationToDelete) return;
        
        setIsDeleting(true);
        try {
            await deleteConversation(conversationToDelete);
            setConversations(prev => prev.filter(c => [c.uid, dbUser?.uid].sort().join('_') !== conversationToDelete));
            if (activeConversation && [activeConversation.uid, dbUser?.uid].sort().join('_') === conversationToDelete) {
                setActiveConversation(null);
                setMessages([]);
            }
            toast({ title: 'Success', description: 'Conversation deleted.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete conversation.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setConversationToDelete(null);
            setShowDeleteAlert(false);
        }
    };


  const handleStartVideoCall = (e: React.FormEvent) => {
    if (!conversationId) return;
    const meetingUrl = `https://meet.jit.si/${conversationId}`;
    const messageContent = `Started a video call: ${meetingUrl}`;
    handleSendMessage(e, messageContent);
  }

  const filteredConversations = useMemo(() => {
      return conversations.filter(convo => convo.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [conversations, searchTerm]);

  if (loading || authLoading) {
    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
                <Shimmer className="col-span-1 h-full" />
                <Shimmer className="col-span-1 md:col-span-2 lg:col-span-3 h-full" />
            </div>
        </div>
    )
  }

  const renderMessageContent = (text: string) => {
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
          >
            {part.includes('meet.jit.si') ? 'Join Video Call' : part}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      }
      return part;
    });
  };

  return (
    <>
    <div className="container mx-auto max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[calc(100vh-80px)]">
        {/* Conversations Sidebar */}
        <div className="col-span-1 flex flex-col border-r bg-background">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Messages</h2>
             <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search friends..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="flex flex-col">
              {filteredConversations.map(convoUser => (
                <div key={convoUser.uid} className="group relative">
                    <Link
                    href={`/messages?with=${convoUser.uid}`}
                    onClick={() => setActiveConversation(convoUser)}
                    className={cn(
                        "flex items-center gap-3 p-4 text-muted-foreground transition-all hover:bg-muted/50 border-b",
                        activeConversation?.uid === convoUser.uid && "bg-muted text-foreground"
                    )}
                    >
                    <Avatar className={cn(
                        "h-12 w-12 border-2",
                        activeConversation?.uid === convoUser.uid ? "border-primary" : "border-transparent"
                    )}>
                        <AvatarImage src={convoUser.photoUrl} alt={convoUser.name} />
                        <AvatarFallback>{convoUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold truncate">{convoUser.name}</span>
                            {convoUser.lastMessage?.createdAt && (
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(convoUser.lastMessage.createdAt), { addSuffix: true })}
                                </span>
                            )}
                        </div>
                        <p className="text-sm truncate text-muted-foreground">
                            {convoUser.lastMessage?.text}
                        </p>
                    </div>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            const convoId = [dbUser!.uid, convoUser.uid].sort().join('_');
                            setConversationToDelete(convoId);
                            setShowDeleteAlert(true);
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
              ))}
               {conversations.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                    No conversations yet. Go make some friends!
                </p>
            )}
            </nav>
          </div>
        </div>

        {/* Chat Window */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col bg-card/50">
          {activeConversation && dbUser ? (
            <>
              <header className="flex flex-row items-center gap-4 p-4 border-b bg-background">
                <Link href={`/profile/${activeConversation._id}`}>
                  <Avatar>
                    <AvatarImage src={activeConversation.photoUrl} alt={activeConversation.name} />
                    <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className='flex-1'>
                    <Link href={`/profile/${activeConversation._id}`}>
                        <h2 className="text-lg font-bold hover:underline">{activeConversation.name}</h2>
                    </Link>
                    <p className='text-xs text-muted-foreground'>Active now</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleStartVideoCall}>
                    <Video className="h-5 w-5" />
                    <span className="sr-only">Start video call</span>
                </Button>
              </header>
              <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-muted/20">
                {messages.map(msg => (
                    <div key={msg._id.toString()} className={cn("group flex items-end gap-2 animate-slide-up", msg.from === dbUser.uid && "justify-end")}>
                      {msg.from !== dbUser.uid && (
                        <Avatar className="h-8 w-8 self-start">
                          <AvatarImage src={activeConversation.photoUrl} alt={activeConversation.name} />
                          <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                       {msg.from === dbUser.uid && (
                           <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                onClick={() => handleDeleteMessage(msg._id.toString())}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                      <div
                        className={cn(
                          "max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2 shadow-sm",
                          msg.from === dbUser.uid
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-background rounded-bl-none"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{renderMessageContent(msg.text)}</p>
                         <p className={cn("text-xs mt-1 text-right", msg.from === dbUser.uid ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                           {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </main>
              <footer className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="relative w-full flex items-center">
                  <Input 
                    placeholder="Type a message..." 
                    className="pr-12 rounded-full bg-muted" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </footer>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-primary/50" />
              <p className="text-lg font-semibold">Select a conversation</p>
              <p className="text-sm">Or slide into someone's DMs from their profile.</p>
              <Button asChild variant="link" className="mt-2"><Link href="/friends">View Friends</Link></Button>
            </div>
          )}
        </div>
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

    

    
