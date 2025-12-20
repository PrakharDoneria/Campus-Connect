import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Ask a Doubt - Campus Connect',
    description: 'Ask questions and get answers from your peers.',
};

export default function DoubtsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
