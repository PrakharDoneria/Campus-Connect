import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Share Assignment - Campus Connect',
    description: 'Share paid or unpaid assignments with your peers and get help from the community.',
};

export default function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
