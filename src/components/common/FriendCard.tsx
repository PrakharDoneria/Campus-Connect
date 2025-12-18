
'use client';

import { IUser } from '@/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export function FriendCard({ user, children }: { user: IUser; children?: React.ReactNode }) {
  return (
    <Card className="flex items-center p-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.photoUrl} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="ml-4 flex-grow">
        <Link href={`/profile/${user._id}`}>
            <p className="font-semibold hover:underline">{user.name}</p>
        </Link>
        <p className="text-sm text-muted-foreground">{user.university}</p>
      </div>
      <div className="ml-auto">{children}</div>
    </Card>
  );
}
