import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Friends - Campus Connect',
    description: 'Manage your friends list, accept new friend requests, and connect with other students.',
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
