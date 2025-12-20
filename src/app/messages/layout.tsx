import type { Metadata } from 'next';
import MessagesClientLayout from './MessagesClientLayout';

export const metadata: Metadata = {
  title: 'Messages - Campus Connect',
  description: 'Your private conversations with other students. Chat in real-time and start video calls.',
};

export default function MessagesLayout({
  children,
  list,
}: {
  children: React.ReactNode;
  list: React.ReactNode;
}) {
  return <MessagesClientLayout list={list}>{children}</MessagesClientLayout>;
}
