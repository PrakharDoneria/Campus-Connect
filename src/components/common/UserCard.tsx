'use client';

import { IUser } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export function UserCard({ user }: { user: IUser }) {

  const handleFollow = () => {
    console.log(`Following user: ${user.name} (${user._id})`);
    // Placeholder for actual follow logic
  };

  return (
    <Link href={`/profile/${user._id.toString()}`}>
        <Card className="flex flex-col items-center justify-center p-4 text-center h-full transition-all hover:shadow-lg hover:border-primary">
        <CardHeader className="p-2">
            <Avatar className="w-24 h-24 mx-auto border-4 border-primary">
            <AvatarImage src={user.photoUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
        </CardHeader>
        <CardContent className="p-2 space-y-2 flex-grow">
            <h3 className="font-bold text-lg">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.university}</p>
            <p className="text-xs text-muted-foreground">{user.major}</p>
        </CardContent>
        <div className="flex w-full gap-2 mt-4">
            <Button size="sm" className="flex-1" onClick={(e) => { e.preventDefault(); handleFollow(); }}>
                <UserPlus className="mr-2 h-4 w-4" /> Follow
            </Button>
            <Button size="sm" variant="outline" className="flex-1" disabled>
                <MessageSquare className="mr-2 h-4 w-4" />
            </Button>
        </div>
        </Card>
    </Link>
  );
}
