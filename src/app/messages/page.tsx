
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUser, getUsers, sendMessage } from '@/lib/actions/user.actions';
import { IUser, IMessage } from '@/types';
import Link from 'next/link';
import { Shimmer } from '@/components/common/Shimmer';
import { cn } from '@/lib/utils';
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { firestore } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { dbUser, loading: authLoading } = useAuth();
  
  const [conversations, setConversations] = useState<IUser[]>([]);
  const [activeConversation, setActiveConversation] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


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
    if (!conversationId) {
        setMessages([]);
        return;
    };

    const messagesCollection = collection(firestore, 'messages');
    const q = query(
        messagesCollection, 
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages: IMessage[] = [];
        querySnapshot.forEach((doc) => {
            newMessages.push({
                _id: doc.id,
                ...doc.data()
            } as IMessage);
        });
        setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [conversationId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !dbUser || !activeConversation) return;

    setIsSending(true);
    try {
        await sendMessage(dbUser.uid, activeConversation.uid, newMessage);
        setNewMessage('');
    } catch (error) {
        console.error('Failed to send message:', error);
    } finally {
        setIsSending(false);
    }
  }

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

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
        {/* Conversations Sidebar */}
        <Card className="col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Chats</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search friends..." className="pl-8" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            <nav className="flex flex-col gap-1">
              {conversations.map(convoUser => (
                <Link
                  key={convoUser.uid}
                  href={`/messages?with=${convoUser.uid}`}
                  onClick={() => setActiveConversation(convoUser)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted",
                    activeConversation?.uid === convoUser.uid && "bg-muted text-primary"
                  )}
                >
                  <Avatar className="h-9 w-9">
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
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
          {activeConversation && dbUser ? (
            <>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src={activeConversation.photoUrl} alt={activeConversation.name} />
                  <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle>{activeConversation.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map(msg => (
                    <div key={msg._id.toString()} className={cn("flex items-end gap-2", msg.from === dbUser.uid && "justify-end")}>
                      {msg.from !== dbUser.uid && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activeConversation.photoUrl} alt={activeConversation.name} />
                          <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-xs md:max-w-md rounded-lg p-3",
                          msg.from === dbUser.uid
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{msg.text}</p>
                         <p className={cn("text-xs mt-1", msg.from === dbUser.uid ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
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
                  ))
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>This is the beginning of your legendary conversation with {activeConversation.name}.</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <form onSubmit={handleSendMessage} className="relative w-full flex items-center">
                  <Input 
                    placeholder="Type a message..." 
                    className="pr-12" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" size="icon" className="absolute right-1" disabled={isSending || !newMessage.trim()}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </CardFooter>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p className="font-semibold">Select a conversation</p>
              <p className="text-sm">Or slide into someone's DMs from their profile.</p>
              <Button asChild variant="link" className="mt-2"><Link href="/friends">View Friends</Link></Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
