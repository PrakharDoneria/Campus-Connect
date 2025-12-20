
'use client';

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { Suspense } from "react";

export default function MessagesClientLayout({
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
        <div className="grid h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] grid-cols-1 md:grid-cols-3 lg:grid-cols-4 border">
            {isMobile ? (
              // On mobile, show list if no chat is open, otherwise show the chat window
              <Suspense fallback={<div>Loading...</div>}>
                {hasChatOpen ? children : list}
              </Suspense>
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
