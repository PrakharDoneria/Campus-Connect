
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { BellRing, Loader2 } from 'lucide-react';

export function NotificationPermissionPrompt() {
  const { requestNotificationPermission } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check for support and permission status after a delay to not be too intrusive
    const timer = setTimeout(() => {
      if (
        isMobile &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'default'
      ) {
        setIsOpen(true);
      }
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, [isMobile]);

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      await requestNotificationPermission();
    } finally {
      setIsRequesting(false);
      setIsOpen(false); // Close the dialog regardless of the outcome
    }
  };

  // We only render this for mobile and when permission is 'default'
  if (!isOpen) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" />
            Enable Notifications
          </AlertDialogTitle>
          <AlertDialogDescription>
            To get real-time alerts for new messages, friend requests, and
            post interactions, please allow notifications. It's essential for
            the best Campus Connect experience!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Maybe Later
          </Button>
          <Button onClick={handleRequest} disabled={isRequesting}>
            {isRequesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enable Notifications
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
