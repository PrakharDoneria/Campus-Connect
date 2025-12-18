'use client';

import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged, signInWithPopup, GithubAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getUser, createUser } from '@/lib/actions/user.actions';
import type { IUser } from '@/types';
import { useToast } from './use-toast';
import LoadingScreen from '@/components/common/LoadingScreen';


interface AuthContextType {
  user: User | null;
  dbUser: IUser | null;
  loading: boolean;
  isProfileComplete: boolean | null;
  signInWithGitHub: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  isProfileComplete: null,
  signInWithGitHub: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

const publicRoutes = ['/'];
const authRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleUser = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      setUser(firebaseUser);
      try {
        let mongoUser = await getUser(firebaseUser.uid);
        if (!mongoUser) {
            const newUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'New User',
                photoUrl: firebaseUser.photoURL || '',
            } as Omit<IUser, '_id' | 'university' | 'major' | 'location'>;
            mongoUser = await createUser(newUser as any);
        }
        setDbUser(mongoUser);
        const profileComplete = !!(mongoUser?.university && mongoUser.major && mongoUser.location);
        setIsProfileComplete(profileComplete);
      } catch (error) {
        console.error('Failed to process user:', error);
        setDbUser(null);
        setIsProfileComplete(false);
      }
    } else {
      setUser(null);
      setDbUser(null);
      setIsProfileComplete(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, [handleUser]);

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    const isPublicRoute = publicRoutes.includes(pathname);

    if (user && isAuthRoute) {
        router.push('/feed');
    } else if (user && isProfileComplete === false && pathname !== '/profile') {
        router.push('/profile');
    } else if (!user && !isPublicRoute && !isAuthRoute) {
        router.push('/');
    }

  }, [user, isProfileComplete, loading, pathname, router]);

  const signInWithGitHub = async () => {
    setLoading(true);
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest, and redirect to /feed
      router.push('/feed');
    } catch (error: any) {
      console.error('GitHub sign-in error:', error);
      toast({
        title: 'Authentication Error',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, isProfileComplete, signInWithGitHub, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
