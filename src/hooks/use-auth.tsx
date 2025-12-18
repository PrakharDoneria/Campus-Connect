'use client';

import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getUser } from '@/lib/actions/user.actions';
import type { IUser } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: User | null;
  dbUser: IUser | null;
  loading: boolean;
  isProfileComplete: boolean | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  isProfileComplete: null,
});

export const useAuth = () => useContext(AuthContext);

const publicRoutes = ['/', '/login', '/signup'];
const authRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const mongoUser = await getUser(user.uid);
          setDbUser(mongoUser);
          const profileComplete = !!(mongoUser?.university && mongoUser.major && mongoUser.location);
          setIsProfileComplete(profileComplete);
        } catch (error) {
          console.error('Failed to fetch user from DB:', error);
          setDbUser(null);
          setIsProfileComplete(false);
        }
      } else {
        setDbUser(null);
        setIsProfileComplete(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = publicRoutes.includes(pathname);
    const isAuthRoute = authRoutes.includes(pathname);
    
    if (user && isAuthRoute) {
      router.push('/feed');
    } else if (user && !isProfileComplete && pathname !== '/profile') {
      router.push('/profile');
    } else if (!user && !isPublicRoute) {
      router.push('/login');
    }
  }, [user, dbUser, loading, pathname, router, isProfileComplete]);
  
  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <GraduationCapIcon className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Campus Connect...</p>
            </div>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, isProfileComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

function GraduationCapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12v5c0 3 4 5 6 5s6-2 6-5v-5" />
    </svg>
  );
}
