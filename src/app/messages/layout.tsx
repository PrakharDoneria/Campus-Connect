
'use client';

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

export default function MessagesLayout({
  children,
  list,
}: {
  children: React.ReactNode;
  list: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <div className="container mx-auto max-w-7xl h-full">
        <div className={cn("grid h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]", isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-4")}>
            {isMobile ? children : (
              <>
                {list}
                {children}
              </>
            )}
        </div>
    </div>
  );
}
