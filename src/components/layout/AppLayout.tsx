
'use client';

import { useAuth } from '@/hooks/use-auth';
import LandingHeader from './LandingHeader';
import MobileNavBar from './MobileNavBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';
import { NotificationPermissionPrompt } from '../common/NotificationPermissionPrompt';

const noNavRoutes = ['/'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { dbUser } = useAuth();
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const showMobileNav = isMobile && dbUser && !noNavRoutes.includes(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      {showMobileNav && <MobileNavBar />}
      {dbUser && <NotificationPermissionPrompt />}
    </div>
  );
}
