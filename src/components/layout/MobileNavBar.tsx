
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, LayoutGrid, MessageSquare, Plus, User, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreatePostForm } from '../common/CreatePostForm';
import type { ICircle } from '@/types';
import { useEffect, useState } from 'react';
import { getCircles } from '@/lib/actions/circle.actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';

export default function MobileNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { dbUser, unreadMessagesCount } = useAuth();
  const [circles, setCircles] = useState<ICircle[]>([]);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const navItems = [
    { href: '/feed', icon: <LayoutGrid />, text: 'Feed' },
    { href: '/nearby', icon: <Compass />, text: 'Discover' },
    { type: 'search', icon: <Search />, text: 'Search' },
    { href: '/messages', icon: <MessageSquare />, text: 'Messages', badge: unreadMessagesCount },
    { href: '/profile', icon: <User />, text: 'Profile' },
  ];
  
  const handlePostCreated = () => {
    // Optionally close the dialog or refresh data
  };

  const handleCircleCreated = (newCircle: ICircle) => {
    setCircles(prev => [...prev, newCircle]);
  };


  return (
    <>
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
        <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
          {navItems.map((item, index) => {
              if (item.type === 'search') {
                return (
                   <Dialog key="search-dialog" open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                    <DialogTrigger asChild>
                      <button className={cn("inline-flex flex-col items-center justify-center px-1 hover:bg-muted group text-muted-foreground")}>
                          <div className="relative">{item.icon}</div>
                          <span className={cn("text-xs font-normal")}>{item.text}</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Search Campus Connect</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSearchSubmit} className="flex gap-2">
                            <Input 
                                placeholder="Search users and circles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    </DialogContent>
                  </Dialog>
                )
              }
              const isActive = pathname.startsWith(item.href!);
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
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 md:hidden">
         <Dialog>
              <DialogTrigger asChild>
                  <button
                      type="button"
                      className="inline-flex items-center justify-center w-14 h-14 font-medium bg-primary text-primary-foreground rounded-full group shadow-lg"
                  >
                      <Plus className="w-6 h-6" />
                      <span className="sr-only">New Post</span>
                  </button>
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
      </div>
    </>
  );
}
