
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUser, getUsers } from '@/lib/actions/user.actions';
import { IUser } from '@/types';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { dbUser, loading: authLoading } = useAuth();
  
  const [conversations, setConversations] = useState<IUser[]>([]);
  const [activeConversation, setActiveConversation] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

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
        setActiveConversation(chatUser);
      } else if (friendUsers.length > 0) {
        setActiveConversation(friendUsers[0]);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [dbUser, chatWithUserUid]);


  if (loading || authLoading) {
    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
                <Skeleton className="col-span-1 h-full" />
                <Skeleton className="col-span-1 md:col-span-2 lg:col-span-3 h-full" />
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
                    {/* Placeholder for last message */}
                    <span className="text-xs">Hey, what's up?</span>
                  </div>
                </Link>
              ))}
               {conversations.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                    No conversations yet. Add friends to start chatting.
                </p>
            )}
            </nav>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
          {activeConversation ? (
            <>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src={activeConversation.photoUrl} alt={activeConversation.name} />
                  <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle>{activeConversation.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {/* Placeholder for messages */}
                <div className="text-center py-16 text-muted-foreground">
                  <p>This is the beginning of your conversation with {activeConversation.name}.</p>
                  <p className="text-sm">Messages are not yet saved or sent in real-time.</p>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <div className="relative w-full flex items-center">
                  <Input placeholder="Type a message..." className="pr-12" />
                  <Button size="icon" className="absolute right-1">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p className="font-semibold">Select a conversation to start chatting</p>
              <p className="text-sm">You can chat with your friends.</p>
              <Button asChild variant="link" className="mt-2"><Link href="/friends">Find Friends</Link></Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
