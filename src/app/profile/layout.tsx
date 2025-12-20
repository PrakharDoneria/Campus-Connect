import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Profile - Campus Connect',
    description: 'View and manage your own profile.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
