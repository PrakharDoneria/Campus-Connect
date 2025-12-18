
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
        <Card>
            <CardHeader>
                <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-semibold">Your messages will appear here.</p>
                    <p className="text-sm">Real-time chat is coming soon!</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
