
'use client';

// This page content is now handled by the parallel routes in @list/page.tsx and the default.tsx file.
// On mobile, this will render the list. On desktop, this is overridden by the layout.
// We can effectively just render the list page content here for the mobile-first approach.
import ListPage from './@list/page';

export default function MessagesPage() {
    return <ListPage />;
}
