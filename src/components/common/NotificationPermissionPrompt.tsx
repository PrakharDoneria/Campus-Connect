
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Bell, X } from 'lucide-react';

export function NotificationPermissionPrompt() {
  const { isProfileComplete, requestNotificationPermission } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (isProfileComplete && permissionStatus === 'default') {
      // Only show the prompt if permission is 'default' (user hasn't made a choice)
      const timer = setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
      return () => clearTimeout(timer);
    } else {
        setShowPrompt(false);
    }
  }, [isProfileComplete, permissionStatus]);

  const handleEnableClick = async () => {
    await requestNotificationPermission();
    // Re-check permission status after request
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
        <Card className="p-4 bg-primary text-primary-foreground">
        <CardContent className="flex items-center justify-between p-0">
            <div className="flex items-center gap-4">
            <Bell className="h-6 w-6" />
            <div>
                <h3 className="font-semibold">Stay in the loop!</h3>
                <p className="text-sm opacity-90">Enable push notifications to get real-time updates.</p>
            </div>
            </div>
            <div className="flex items-center gap-2">
            <Button
                variant="secondary"
                size="sm"
                onClick={handleEnableClick}
            >
                Enable
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/80"
                onClick={handleDismiss}
            >
                <X className="h-4 w-4" />
            </Button>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
