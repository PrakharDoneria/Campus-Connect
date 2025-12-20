import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Discover Students - Campus Connect',
    description: 'Find and connect with other students on your campus.',
};

export default function NearbyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
