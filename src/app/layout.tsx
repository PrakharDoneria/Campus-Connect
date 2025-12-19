
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/layout/AppLayout';
import { useEffect } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('Service Worker registration successful, scope is:', registration.scope);
          })
          .catch((err) => {
            console.log('Service Worker registration failed, error:', err);
          });
      });
    }
  }, []);
  
  const metadata: Metadata = {
    title: 'Campus Connect',
    description: 'A localized social network for college students.',
  };


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
