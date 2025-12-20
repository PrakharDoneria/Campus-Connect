import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Friends - Campus Connect',
    description: 'Manage your friends and friend requests.',
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
