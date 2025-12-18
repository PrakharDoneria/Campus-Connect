'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Search, Loader2, Video, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUser, getUsers } from '@/lib/actions/user.actions';
import { sendMessage, markConversationAsRead } from '@/lib/actions/message.actions';
import { IUser, IMessage } from '@/types';
import Link from 'next/link';
import { Shimmer } from '@/components/common/Shimmer';
import { cn } from '@/lib/utils';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { dbUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<IUser[]>([]);
  const [activeConversation, setActiveConversation] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  const chatWithUserUid = searchParams.get('with');

  useEffect(() => {
    async function fetchData() {
      if (!dbUser) return;
      setLoading(true);

      const friendUsers = await getUsers(dbUser.friends);
      setConversations(friendUsers);

      if (chatWithUserUid) {
        let chatUser = friendUsers.find(f => f.uid === chatWithUserUid);
        if (!chatUser) {
            chatUser = await getUser(chatWithUserUid);
        }
        if (chatUser) {
            setActiveConversation(chatUser);
            // Add user to conversations if not already a friend (e.g. direct link)
            if (!friendUsers.some(f => f.uid === chatUser.uid)) {
                setConversations(prev => [chatUser, ...prev]);
            }
        }
      } else if (friendUsers.length > 0) {
        setActiveConversation(friendUsers[0]);
      }
      
      setLoading(false);
    }
    fetchData();
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
    if (!textToSend.trim() || !dbUser || !activeConversation || isSending) return;

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
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
        {/* Conversations Sidebar */}
        <Card className="col-span-1 flex flex-col">
          <CardHeader>
             <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search friends..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            <nav className="flex flex-col gap-1">
              {filteredConversations.map(convoUser => (
                <Link
                  key={convoUser.uid}
                  href={`/messages?with=${convoUser.uid}`}
                  onClick={() => setActiveConversation(convoUser)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted relative",
                    activeConversation?.uid === convoUser.uid && "bg-muted text-primary-foreground"
                  )}
                >
                  <Avatar className={cn(
                    "h-10 w-10 border-2",
                    activeConversation?.uid === convoUser.uid ? "border-primary" : "border-transparent"
                  )}>
                    <AvatarImage src={convoUser.photoUrl} alt={convoUser.name} />
                    <AvatarFallback>{convoUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold">{convoUser.name}</span>
                  </div>
                </Link>
              ))}
               {conversations.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                    No conversations yet. Go make some friends!
                </p>
            )}
            </nav>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col bg-card/50">
          {activeConversation && dbUser ? (
            <>
              <CardHeader className="flex flex-row items-center gap-4 p-4 border-b">
                <Avatar>
                  <AvatarImage src={activeConversation.photoUrl} alt={activeConversation.name} />
                  <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                    <h2 className="text-lg font-bold">{activeConversation.name}</h2>
                    <p className='text-xs text-muted-foreground'>Active now</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleStartVideoCall}>
                    <Video className="h-5 w-5" />
                    <span className="sr-only">Start video call</span>
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg._id.toString()} className={cn("flex items-end gap-2 animate-slide-up", msg.from === dbUser.uid && "justify-end")}>
                      {msg.from !== dbUser.uid && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activeConversation.photoUrl} alt={activeConversation.name} />
                          <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-xs md:max-w-md rounded-xl p-3 shadow-sm",
                          msg.from === dbUser.uid
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted rounded-bl-none"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{renderMessageContent(msg.text)}</p>
                         <p className={cn("text-xs mt-1 text-right", msg.from === dbUser.uid ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                           {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                       {msg.from === dbUser.uid && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={dbUser.photoUrl} alt={dbUser.name} />
                          <AvatarFallback>{dbUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </CardContent>
              <CardFooter className="p-4 border-t bg-background/80">
                <form onSubmit={handleSendMessage} className="relative w-full flex items-center">
                  <Input 
                    placeholder="Type a message..." 
                    className="pr-12 rounded-full" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-primary/50" />
              <p className="text-lg font-semibold">Select a conversation</p>
              <p className="text-sm">Or slide into someone's DMs from their profile.</p>
              <Button asChild variant="link" className="mt-2"><Link href="/friends">View Friends</Link></Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
