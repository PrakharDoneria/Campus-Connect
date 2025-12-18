
'use client';

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
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

function NavLinks() {
  const pathname = usePathname();
  const { toast } = useToast();

   const handleInvite = async () => {
    const inviteUrl = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Campus Connect!',
          text: `Check out Campus Connect, the social network for students.`,
          url: inviteUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(inviteUrl);
      toast({
        title: 'Invite Link Copied!',
        description: 'The invite link has been copied to your clipboard.',
      });
    }
  };

  const navItems = [
    { href: '/feed', icon: <LayoutGrid />, text: 'Feed' },
    { href: '/nearby', icon: <Users />, text: 'Nearby' },
    { href: '/friends', icon: <Users />, text: 'Friends' },
    { href: '/messages', icon: <MessageSquare />, text: 'Messages' },
  ];

  return (
    <nav className="flex flex-col gap-2 p-4">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? 'secondary' : 'ghost'}
          asChild
          className="justify-start"
        >
          <Link href={item.href}>
            {item.icon}
            <span>{item.text}</span>
          </Link>
        </Button>
      ))}
       <Button
          variant='ghost'
          onClick={handleInvite}
          className="justify-start"
        >
            <Share2 />
            <span>Invite Friend</span>
        </Button>
    </nav>
  );
}

export default function LandingHeader() {
  const { user, loading, signInWithGitHub, signInWithGoogle, signOut, dbUser } = useAuth();
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline-block">Campus Connect</span>
        </Link>
        <nav className="flex items-center gap-4">
          {!loading &&
            (user && dbUser ? (
              <>
                {isMobile ? (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <PanelLeft />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader>
                        <SheetTitle>
                          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                            <GraduationCap className="h-6 w-6 text-primary" />
                            <span>Campus Connect</span>
                          </Link>
                        </SheetTitle>
                      </SheetHeader>
                      <NavLinks />
                    </SheetContent>
                  </Sheet>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                     <Button variant="ghost" asChild><Link href="/feed">Feed</Link></Button>
                     <Button variant="ghost" asChild><Link href="/nearby">Nearby</Link></Button>
                     <Button variant="ghost" asChild><Link href="/friends">Friends</Link></Button>
                     <Button variant="ghost" asChild><Link href="/messages">Messages</Link></Button>
                  </div>
                )}
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
        </nav>
      </div>
    </header>
  );
}
