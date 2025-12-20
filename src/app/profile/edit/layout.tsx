import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Profile - Campus Connect',
    description: 'Update your profile information, such as your university, major, and location.',
};

export default function ProfileEditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
