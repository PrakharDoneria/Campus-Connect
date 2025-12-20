import { getUser } from '@/lib/actions/user.actions';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  const user = await getUser(id);
 
  return {
    title: `${user?.name || 'User Profile'} - Campus Connect`,
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
