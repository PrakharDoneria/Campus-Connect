import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { name: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const name = params.name
  return {
    title: `c/${name} - Campus Connect`,
  }
}

export default function CircleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
