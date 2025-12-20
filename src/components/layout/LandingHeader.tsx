
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import {
  Github,
  GraduationCap,
  LayoutGrid,
  LogOut,
  MessageSquare,
  PanelLeft,
  Share2,
  User,
  Users,
  Compass,
  Search,
  Bell,
  HandCoins,
  Moon,
  Sun,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { GoogleIcon } from '../icons';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';
import { useTheme } from 'next-themes';

function DesktopNavLinks() {
  const pathname = usePathname();
  const { unreadMessagesCount, friendRequestCount, requestNotificationPermission } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navItems = [
    { href: '/feed', icon: <LayoutGrid />, text: 'Feed' },
    { href: '/doubts', icon: <HelpCircle />, text: 'Doubts' },
    { href: '/assignments', icon: <FileText />, text: 'Assignments' },
    { href: '/nearby', icon: <Compass />, text: 'Discover' },
    { href: '/friends', icon: <Users />, text: 'Friends', badge: friendRequestCount },
    { href: '/messages', icon: <MessageSquare />, text: 'Messages', badge: unreadMessagesCount },
  ];

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={handleSearchSubmit} className="relative mr-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-9 w-48"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              onClick={requestNotificationPermission}
              className="justify-center w-12 h-12 rounded-full"
            >
              <Bell />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
              <p>Enable Notifications</p>
          </TooltipContent>
        </Tooltip>

        {navItems.map((item) => (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
                <Button
                    variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                    asChild
                    className="justify-center w-12 h-12 rounded-full"
                >
                <Link href={item.href} className="relative">
                    {item.icon}
                    {item.badge && item.badge > 0 ? (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 md:h-4 md:w-4">{item.badge}</Badge>
                    ) : null}
                </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                <p>{item.text}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}

function ThemeToggleButton() {
    const { setTheme, theme } = useTheme();
    return (
        <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
            <span>Toggle Theme</span>
        </DropdownMenuItem>
    )
}

export default function LandingHeader() {
  const { user, loading, signInWithGitHub, signInWithGoogle, signOut, dbUser } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-4">
          {!loading &&
            (user && dbUser ? (
              <>
                {!isMobile && <DesktopNavLinks />}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer h-9 w-9">
                      <AvatarImage src={dbUser?.photoUrl} alt={dbUser?.name} />
                      <AvatarFallback>{dbUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{dbUser.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/contribute">
                        <HandCoins className="mr-2 h-4 w-4" />
                        <span>Contribute</span>
                      </Link>
                    </DropdownMenuItem>
                    <ThemeToggleButton />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Sheet>
                <SheetTrigger asChild>
                  <Button>Login / Sign Up</Button>
                </SheetTrigger>
                <SheetContent side={isMobile ? 'bottom' : 'right'} className={isMobile ? "rounded-t-lg" : ""}>
                  <SheetHeader className="text-center">
                    <SheetTitle>Join Campus Connect</SheetTitle>
                    <SheetDescription>
                      Sign in or create an account to connect with your campus.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 p-4 items-center">
                    <Button
                      onClick={signInWithGoogle}
                      variant="outline"
                      className="w-full max-w-xs"
                    >
                      <GoogleIcon className="mr-2 h-4 w-4" />
                      Sign in with Google
                    </Button>
                    <Button
                      onClick={signInWithGitHub}
                      className="w-full max-w-xs"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      Sign in with GitHub
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            ))}
        </div>
      </div>
    </header>
  );
}
