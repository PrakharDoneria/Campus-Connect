
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaPrompt() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      // Show the install prompt after a short delay if it hasn't been shown recently
      const lastPrompted = localStorage.getItem('installPromptedAt');
      const oneDay = 24 * 60 * 60 * 1000;
      if (!lastPrompted || (new Date().getTime() - Number(lastPrompted)) > oneDay) {
        setTimeout(() => setIsDialogOpen(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    
    await installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    
    if (outcome === 'accepted') {
      toast({ title: "App Installed!", description: "Campus Connect is now on your home screen." });
    }
    
    setInstallPromptEvent(null);
    setIsDialogOpen(false);
  };

  const handleClose = () => {
    localStorage.setItem('installPromptedAt', new Date().getTime().toString());
    setIsDialogOpen(false);
  };

  if (!isDialogOpen || !installPromptEvent) {
    return null;
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Download className="h-6 w-6 text-primary" />
            Install Campus Connect
          </AlertDialogTitle>
          <AlertDialogDescription>
            For a better experience, add Campus Connect to your home screen. It's fast, free, and uses almost no storage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Not Now
          </Button>
          <Button onClick={handleInstallClick}>
            Install App
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
