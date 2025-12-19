
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Video, ExternalLink, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUser } from '@/lib/actions/user.actions';
import { sendMessage, markConversationAsRead, deleteMessage } from '@/lib/actions/message.actions';
import { IUser, IMessage } from '@/types';
import Link from 'next/link';
import { Shimmer } from '@/components/common/Shimmer';
import { cn } from '@/lib/utils';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { dbUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const conversationId = params.id as string;
  
  const [otherUser, setOtherUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUserUid = useMemo(() => {
    if (!conversationId || !dbUser?.uid) return null;
    return conversationId.replace(dbUser.uid, '').replace('_', '');
  }, [conversationId, dbUser?.uid]);


  useEffect(() => {
    if (!otherUserUid) {
      if (!authLoading && conversationId) {
        // Handle case where user is not found or invalid conversation
        router.push('/messages');
      }
      return;
    };
    const fetchOtherUser = async () => {
        try {
            setLoading(true);
            const user = await getUser(otherUserUid);
            setOtherUser(user);
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            toast({ title: 'Error', description: 'Could not load user data.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };
    fetchOtherUser();
  }, [otherUserUid, toast, authLoading, conversationId, router]);


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
    }, (error) => {
        console.error("Error fetching messages:", error);
        toast({ title: "Error", description: "Could not load messages.", variant: "destructive" });
    });

    return () => unsubscribe();
  }, [conversationId, dbUser, toast]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent, content?: string) => {
    e.preventDefault();
    const textToSend = content || newMessage;
    if (!textToSend.trim() || !dbUser || !otherUser) return;

    const optimisticNewMessage = textToSend;
    setNewMessage(''); 

    try {
        await sendMessage(dbUser.uid, otherUser.uid, optimisticNewMessage);
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


  const handleStartVideoCall = (e: React.FormEvent) => {
    if (!conversationId) return;
    const meetingUrl = `https://meet.jit.si/${conversationId}`;
    const messageContent = `Started a video call: ${meetingUrl}`;
    handleSendMessage(e, messageContent);
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

  if (loading || authLoading || !otherUserUid) {
      return (
          <div className="flex flex-col h-full">
              <header className="flex items-center gap-4 p-4 border-b bg-background">
                  <Shimmer className="h-10 w-10 rounded-full" />
                  <div className='flex-1 space-y-2'>
                      <Shimmer className="h-5 w-32" />
                      <Shimmer className="h-3 w-20" />
                  </div>
              </header>
              <main className="flex-1 p-6 space-y-4 overflow-y-auto">
                  <Shimmer className="h-12 w-48 rounded-lg self-start" />
                  <Shimmer className="h-16 w-64 rounded-lg self-end ml-auto" />
                  <Shimmer className="h-12 w-40 rounded-lg self-start" />
              </main>
          </div>
      )
  }

  if (!otherUser || !dbUser) {
      return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-80px)] bg-card/50 page-transition">
      <header className="flex flex-row items-center gap-2 p-2 border-b bg-background">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <Link href={`/profile/${otherUser._id}`} className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={otherUser.photoUrl} alt={otherUser.name} />
            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className='flex-1'>
            <Link href={`/profile/${otherUser._id}`}>
                <h2 className="text-lg font-bold hover:underline">{otherUser.name}</h2>
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
                  <AvatarImage src={otherUser.photoUrl} alt={otherUser.name} />
                  <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
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
    </div>
  );
}
