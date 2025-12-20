
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, LayoutGrid, MessageSquare, Plus, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreatePostForm } from '../common/CreatePostForm';
import type { ICircle } from '@/types';
import { useEffect, useState } from 'react';
import { getCircles } from '@/lib/actions/circle.actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';

export default function MobileNavBar() {
  const pathname = usePathname();
  const { dbUser, unreadMessagesCount } = useAuth();
  const [circles, setCircles] = useState<ICircle[]>([]);
  const { toast } = useToast();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

  useEffect(() => {
      async function fetchCircles() {
          if (!dbUser) return;
          try {
              const fetchedCircles = await getCircles();
              setCircles(fetchedCircles);
          } catch (error) {
              toast({ title: "Error", description: "Could not load circles for posting." });
          }
      }
      fetchCircles();
  }, [dbUser, toast]);

  if (!dbUser) return null;
  
  const navItems = [
    { href: '/feed', icon: <LayoutGrid />, text: 'Feed' },
    { href: '/nearby', icon: <Compass />, text: 'Discover' },
    { type: 'create', icon: <Plus className="h-6 w-6" />, text: 'Post' },
    { href: '/messages', icon: <MessageSquare />, text: 'Messages', badge: unreadMessagesCount },
    { href: '/profile', icon: <User />, text: 'Profile' },
  ];
  
  const handlePostCreated = () => {
    setIsPostDialogOpen(false);
  };

  const handleCircleCreated = (newCircle: ICircle) => {
    setCircles(prev => [...prev, newCircle]);
  };


  return (
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
        <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
          {navItems.map((item) => {
              if (item.type === 'create') {
                return (
                  <Dialog key="create-post" open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="inline-flex flex-col items-center justify-center px-1 h-full hover:bg-muted group text-muted-foreground"
                      >
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:bg-primary/90">
                           {item.icon}
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <CreatePostForm 
                        user={dbUser} 
                        circles={circles} 
                        onPostCreated={handlePostCreated} 
                        onCircleCreated={handleCircleCreated} 
                      />
                    </DialogContent>
                  </Dialog>
                )
              }
              const isActive = pathname === item.href;
              return (
                  <Link
                      key={item.href}
                      href={item.href!}
                      className={cn(
                          "inline-flex flex-col items-center justify-center px-1 hover:bg-muted group",
                          isActive ? "text-primary" : "text-muted-foreground"
                      )}
                  >
                      <div className="relative">
                          {item.icon}
                          {'badge' in item && item.badge && item.badge > 0 ? (
                              <Badge variant="destructive" className="absolute -top-2 -right-3 h-5 w-5 flex items-center justify-center p-0">{item.badge}</Badge>
                          ) : null}
                      </div>
                      <span className={cn("text-xs", isActive ? "font-semibold" : "font-normal")}>{item.text}</span>
                  </Link>
              )
          })}
        </div>
      </div>
  );
}
