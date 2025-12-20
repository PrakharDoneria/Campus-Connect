
'use client';

import ListPage from './@list/page';
import { useIsMobile } from '@/hooks/use-mobile';
import MessagesDefaultPage from './default';

export default function MessagesPage() {
    const isMobile = useIsMobile();
    
    // On mobile, we render nothing here. The layout's `list` slot, which is a parallel route,
    // will be rendered as the `children` by the layout, correctly showing the list.
    if (isMobile) {
        return null;
    }

    // On desktop, the layout shows the list and children side-by-side. 
    // We render the default page content here for the `children` prop.
    return <MessagesDefaultPage />;
}
