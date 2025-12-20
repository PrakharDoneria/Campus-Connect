import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Share Assignment - Campus Connect',
    description: 'Share and discover assignments from your peers.',
};

export default function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
