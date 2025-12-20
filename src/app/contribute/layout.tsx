import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contribute - Campus Connect',
    description: 'Help support and grow the Campus Connect platform.',
};

export default function ContributeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
