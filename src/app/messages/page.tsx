
'use client';

// On mobile, this renders the conversation list.
// On desktop, this route is active, but the `default.tsx` parallel route provides the content for the `children` prop in the layout.
// This component now correctly renders the list only for the mobile view.
import ListPage from './@list/page';
import { useIsMobile } from '@/hooks/use-mobile';
import MessagesDefaultPage from './default';

export default function MessagesPage() {
    const isMobile = useIsMobile();
    // On mobile, show the list. On desktop, the layout shows the list via a parallel route,
    // and the `children` are handled by `default.tsx`, so we render nothing here to avoid duplication.
    return isMobile ? <ListPage /> : <MessagesDefaultPage />;
}
