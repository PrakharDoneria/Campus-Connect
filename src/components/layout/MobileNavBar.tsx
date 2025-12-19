'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, LayoutGrid, MessageSquare, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export default function MobileNavBar() {
  const pathname = usePathname();
  const { unreadMessagesCount, friendRequestCount } = useAuth();

  const navItems = [
    { href: '/feed', icon: <LayoutGrid />, text: 'Feed' },
    { href: '/nearby', icon: <Compass />, text: 'Nearby' },
    { href: '/friends', icon: <Users />, text: 'Friends', badge: friendRequestCount },
    { href: '/messages', icon: <MessageSquare />, text: 'Messages', badge: unreadMessagesCount },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-muted group",
                isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 ? (
                    <Badge variant="destructive" className="absolute -top-2 -right-3 h-5 w-5 flex items-center justify-center p-0">{item.badge}</Badge>
                ) : null}
            </div>
            <span className={cn(
                "text-xs",
                isActive ? "font-semibold" : "font-normal"
            )}>{item.text}</span>
          </Link>
        )})}
      </div>
    </div>
  );
}
