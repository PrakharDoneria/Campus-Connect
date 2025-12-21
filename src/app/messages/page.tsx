
'use client';

import MessagesDefaultPage from './default';

export default function MessagesPage() {
    // This page component now only renders the default view for desktop.
    // On mobile, the layout file handles showing the list or the chat view.
    return <MessagesDefaultPage />;
}
