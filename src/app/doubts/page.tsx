
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
import { createDoubt, getDoubts } from '@/lib/actions/doubt.actions';
import { getCircles } from '@/lib/actions/circle.actions';
import type { IDoubt, ICircle } from '@/types';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function DoubtCard({ doubt }: { doubt: IDoubt }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={doubt.author.avatarUrl} alt={doubt.author.name} />
                        <AvatarFallback>{doubt.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{doubt.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <p className="whitespace-pre-wrap">{doubt.description}</p>
            </CardContent>
        </Card>
    );
}


export default function DoubtsPage() {
    const { dbUser, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [circle, setCircle] = useState('general');
    const [circles, setCircles] = useState<ICircle[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [doubts, setDoubts] = useState<IDoubt[]>([]);
    const [loadingDoubts, setLoadingDoubts] = useState(true);

    useEffect(() => {
        async function fetchInitialData() {
            try {
                setLoadingDoubts(true);
                const [fetchedDoubts, fetchedCircles] = await Promise.all([
                    getDoubts(),
                    getCircles(),
                ]);
                setDoubts(fetchedDoubts);
                setCircles(fetchedCircles);
            } catch (error) {
                toast({ title: 'Error', description: 'Could not fetch doubts.', variant: 'destructive' });
            } finally {
                setLoadingDoubts(false);
            }
        }
        fetchInitialData();
    }, [toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dbUser) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }
        if (!title.trim() || !description.trim() || !subject.trim() || !circle) {
            toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const newDoubt = await createDoubt({ title, description, subject, circle }, dbUser);
            setDoubts(prev => [newDoubt, ...prev]);
            setTitle('');
            setDescription('');
            setSubject('');
            setCircle('general');
            toast({ title: 'Success', description: 'Your doubt has been posted.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!dbUser && !authLoading) {
        return (
            <div className="container mx-auto p-4 max-w-2xl text-center">
                <p>Please <Link href="/" className="underline text-primary">log in</Link> to ask or view doubts.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Ask a Doubt</h1>
            
            <Card className="mb-8">
                <CardContent className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., How does photosynthesis work?" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Biology" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="circle">Community Circle</Label>
                                <Select onValueChange={setCircle} value={circle}>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a circle to post in" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {circles.map(c => (
                                        <SelectItem key={c.name} value={c.name}>c/{c.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide more details about your question..." />
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Post Doubt'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Recent Doubts</h2>
            <div className="space-y-6">
                {loadingDoubts ? (
                    <>
                        <Shimmer className="h-48 w-full" />
                        <Shimmer className="h-48 w-full" />
                    </>
                ) : doubts.length > 0 ? (
                    doubts.map(doubt => <DoubtCard key={doubt._id.toString()} doubt={doubt} />)
                ) : (
                    <p className="text-center text-muted-foreground py-8">No doubts have been asked yet. Be the first!</p>
                )}
            </div>
        </div>
    );
}
