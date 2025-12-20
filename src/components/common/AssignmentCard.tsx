
'use client';

import { IAssignment } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';

export function AssignmentCard({ assignment }: { assignment: IAssignment }) {
    return (
        <Card className="border-l-4 border-accent transition-all hover:shadow-md">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={assignment.author.avatarUrl} alt={assignment.author.name} />
                            <AvatarFallback>{assignment.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{assignment.title}</h3>
                            <div className="flex items-center flex-wrap gap-x-2 text-sm text-muted-foreground">
                                <span>by {assignment.author.name}</span>
                                <span>•</span>
                                <Link href={`/c/${assignment.circle}`} className="hover:underline">
                                    c/{assignment.circle}
                                </Link>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })}</span>
                            </div>
                            <p className="text-sm font-bold text-primary mt-1">{assignment.subject}</p>
                        </div>
                    </div>
                     {assignment.isPaid && (
                        <div className="flex items-center gap-2 text-lg font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full mt-2 sm:mt-0">
                            <DollarSign className="h-5 w-5" />
                            <span>{assignment.reward}</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap text-sm">{assignment.description}</p>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
                    <p className="text-sm text-destructive font-semibold">Due: {format(new Date(assignment.dueDate), "PPP")}</p>
                    <Button asChild>
                        <Link href="/assignments">View Details & Help</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
