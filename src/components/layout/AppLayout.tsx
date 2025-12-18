
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { GraduationCap, LayoutGrid, LogOut, PanelLeft, Share2, User, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotificationPermissionPrompt } from '../common/NotificationPermissionPrompt';

function MobileHeader() {
  const { dbUser } = useAuth();
  return (
    <header className="md:hidden sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger>
          <PanelLeft />
        </SidebarTrigger>
        <Link href="/feed" className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="sr-only">Campus Connect</span>
        </Link>
      </div>
       <Link href="/profile">
        <Avatar className="size-8">
          <AvatarImage src={dbUser?.photoUrl} alt={dbUser?.name} />
          <AvatarFallback>{dbUser?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
       </Link>
    </header>
  );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { dbUser, signOut } = useAuth();
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

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden"/>
            <GraduationCap className="size-6 text-primary" />
            <span className="text-lg font-semibold">Campus Connect</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/feed">
                <SidebarMenuButton isActive={pathname === '/feed'} tooltip="Feed">
                  <LayoutGrid />
                  <span>Feed</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/nearby">
                <SidebarMenuButton isActive={pathname.startsWith('/nearby')} tooltip="Nearby">
                  <Users />
                  <span>Nearby</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={handleInvite} tooltip="Invite">
                    <Share2 />
                    <span>Invite Friend</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/profile">
                <SidebarMenuButton isActive={pathname === '/profile'} tooltip="Profile">
                  <User />
                  <span>Profile</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarHeader className="mt-auto">
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={dbUser?.photoUrl} alt={dbUser?.name} />
              <AvatarFallback>{dbUser?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{dbUser?.name}</span>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={signOut}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </SidebarHeader>
      </Sidebar>
      <SidebarInset>
        <MobileHeader />
        <NotificationPermissionPrompt />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

