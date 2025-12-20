import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Profile - Campus Connect',
    description: 'Update your profile information.',
};

export default function ProfileEditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
