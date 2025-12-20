
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Shimmer } from '@/components/common/Shimmer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createAssignment, getAssignments } from '@/lib/actions/assignment.actions';
import type { IAssignment } from '@/types';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

function AssignmentCard({ assignment }: { assignment: IAssignment }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={assignment.author.avatarUrl} alt={assignment.author.name} />
                        <AvatarFallback>{assignment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{assignment.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>by {assignment.author.name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })}</span>
                        </div>
                         <p className="text-sm font-bold text-primary mt-1">{assignment.subject}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{assignment.description}</p>
                <p className="text-sm text-destructive font-semibold mt-4">Due: {format(new Date(assignment.dueDate), "PPP")}</p>
            </CardContent>
        </Card>
    );
}


export default function AssignmentsPage() {
    const { dbUser, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignments, setAssignments] = useState<IAssignment[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);

    useEffect(() => {
        async function fetchAssignments() {
            try {
                setLoadingAssignments(true);
                const fetchedAssignments = await getAssignments();
                setAssignments(fetchedAssignments);
            } catch (error) {
                toast({ title: 'Error', description: 'Could not fetch assignments.', variant: 'destructive' });
            } finally {
                setLoadingAssignments(false);
            }
        }
        fetchAssignments();
    }, [toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dbUser) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }
        if (!title.trim() || !description.trim() || !subject.trim() || !dueDate) {
            toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const newAssignment = await createAssignment({ title, description, subject, dueDate: new Date(dueDate) }, dbUser);
            setAssignments(prev => [newAssignment, ...prev]);
            setTitle('');
            setDescription('');
            setSubject('');
            setDueDate('');
            toast({ title: 'Success', description: 'Your assignment has been shared.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!dbUser && !authLoading) {
        return (
            <div className="container mx-auto p-4 max-w-2xl text-center">
                <p>Please <Link href="/" className="underline text-primary">log in</Link> to share or view assignments.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Share an Assignment</h1>
            
            <Card className="mb-8">
                <CardContent className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., History Essay on the Roman Empire" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., History" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due-date">Due Date</Label>
                            <Input id="due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide assignment details, requirements, etc." />
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Share Assignment'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Recently Shared Assignments</h2>
            <div className="space-y-6">
                {loadingAssignments ? (
                    <>
                        <Shimmer className="h-48 w-full" />
                        <Shimmer className="h-48 w-full" />
                    </>
                ) : assignments.length > 0 ? (
                    assignments.map(assignment => <AssignmentCard key={assignment._id.toString()} assignment={assignment} />)
                ) : (
                    <p className="text-center text-muted-foreground py-8">No assignments have been shared yet. Be the first!</p>
                )}
            </div>
        </div>
    );
}
