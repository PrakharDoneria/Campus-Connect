import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Ask a Doubt - Campus Connect',
    description: 'Post your academic questions and get answers from other students and experts in your community circles.',
};

export default function DoubtsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
