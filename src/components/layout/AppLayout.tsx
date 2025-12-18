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
import { GraduationCap, LayoutGrid, LogOut, User, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, dbUser, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SidebarTrigger />
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
                <SidebarMenuButton isActive={pathname === '/nearby'} tooltip="Nearby">
                  <Users />
                  <span>Nearby</span>
                </SidebarMenuButton>
              </Link>
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
        <SidebarHeader>
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
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
