import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Feed - Campus Connect',
    description: 'The main feed for all campus happenings.',
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
