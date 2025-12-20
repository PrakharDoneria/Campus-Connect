import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Feed - Campus Connect',
    description: 'The main social feed for all campus happenings. See posts, assignments, doubts, and user suggestions.',
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
