
'use client';

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function MessagesLayout({
  children,
  list,
}: {
  children: React.ReactNode;
  list: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  // On mobile, the `children` will be either the list or the chat.
  // On desktop, we show the list and the children side-by-side.
  return (
    <div className="container mx-auto max-w-7xl h-full">
        <div className={cn("grid h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]", isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-4")}>
            {isMobile ? (
              // On mobile, only render the active child route, which will be either the list or a specific chat.
              children
            ) : (
              // On desktop, always render the list and the active child (chat or default message).
              <>
                {list}
                {children}
              </>
            )}
        </div>
    </div>
  );
}
