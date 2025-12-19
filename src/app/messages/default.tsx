
'use client';

import { MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MessagesDefaultPage() {
    const isMobile = useIsMobile();

    if (isMobile) {
        // On mobile, the list is the main view, so we render nothing here.
        // The layout file will handle showing the list.
        return null;
    }

    return (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col bg-card/50 h-full">
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                <p className="text-lg font-semibold">Select a conversation</p>
                <p className="text-sm">Your chats will appear here.</p>
            </div>
        </div>
    );
}
