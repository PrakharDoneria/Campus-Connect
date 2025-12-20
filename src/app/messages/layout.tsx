'use client';

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

// Note: Titles for dynamic chat pages are handled in the [id]/page.tsx file
// as this layout is a client component.

export default function MessagesLayout({
  children,
  list,
}: {
  children: React.ReactNode;
  list: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const params = useParams();
  const hasChatOpen = !!params.id;

  return (
    <div className="container mx-auto max-w-7xl h-full">
        <div className="grid h-[calc(100vh-80px)] md:h-[calc(100vh-80px)] grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
            {isMobile ? (
              // On mobile, show list if no chat is open, otherwise show the chat window
              hasChatOpen ? children : list
            ) : (
              // On desktop, always render the list and the active child (chat or default message).
              <>
                {list}
                <div className="md:col-span-2 lg:col-span-3">
                    {children}
                </div>
              </>
            )}
        </div>
    </div>
  );
}
