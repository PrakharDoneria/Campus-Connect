
'use client';

import { useAuth } from '@/hooks/use-auth';
import LandingHeader from './LandingHeader';
import MobileNavBar from './MobileNavBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';
import { NotificationPermissionPrompt } from '../common/NotificationPermissionPrompt';
import { useEffect } from 'react';

const noNavRoutes = ['/'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { dbUser } = useAuth();
  const isMobile = useIsMobile();
  const pathname = usePathname();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('Service Worker registration successful, scope is:', registration.scope);
          })
          .catch((err) => {
            console.log('Service Worker registration failed, error:', err);
          });
      });
    }
  }, []);

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
