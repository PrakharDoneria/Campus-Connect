import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Search - Campus Connect',
    description: 'Search for users and content on Campus Connect.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
