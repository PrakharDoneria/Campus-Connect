import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contribute - Campus Connect',
    description: 'Help support and grow the Campus Connect platform by contributing code or donating to cover server costs.',
};

export default function ContributeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
