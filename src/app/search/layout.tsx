import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Search - Campus Connect',
    description: 'Search for users and community circles on Campus Connect.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
