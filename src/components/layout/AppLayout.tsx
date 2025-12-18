
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { NotificationPermissionPrompt } from '../common/NotificationPermissionPrompt';
import LandingHeader from './LandingHeader';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { dbUser, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <NotificationPermissionPrompt />
        {children}
      </main>
    </div>
  );
}
