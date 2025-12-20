
'use client';

import { IDoubt } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function DoubtCard({ doubt }: { doubt: IDoubt }) {
    return (
        <Card className="transition-all hover:shadow-md">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={doubt.author.avatarUrl} alt={doubt.author.name} />
                        <AvatarFallback>{doubt.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{doubt.title}</h3>
                        <div className="flex items-center flex-wrap gap-x-2 text-sm text-muted-foreground">
                            <span>by {doubt.author.name}</span>
                            <span>•</span>
                            <Link href={`/c/${doubt.circle}`} className="hover:underline">
                                c/{doubt.circle}
                            </Link>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(doubt.createdAt), { addSuffix: true })}</span>
                        </div>
                         <p className="text-sm font-bold text-primary mt-1">{doubt.subject}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap text-sm">{doubt.description}</p>
                 <div className="text-right mt-4">
                    <Button asChild>
                        <Link href="/doubts">View Details & Answer</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
