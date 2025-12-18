'use client';

import { AuthProvider } from '@/hooks/use-auth';
import type { ReactNode } from 'react';

export function AppProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
