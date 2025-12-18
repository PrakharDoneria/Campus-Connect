'use client';

import { auth, messaging } from '@/lib/firebase';
import { User, onAuthStateChanged, signInWithPopup, GithubAuthProvider, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getUser, createUser, updateUser } from '@/lib/actions/user.actions';
import type { IUser } from '@/types';
import { useToast } from './use-toast';
import LoadingScreen from '@/components/common/LoadingScreen';
import { getToken } from 'firebase/messaging';


interface AuthContextType {
  user: User | null;
  dbUser: IUser | null;
  loading: boolean;
  isProfileComplete: boolean | null;
  signInWithGitHub: () => void;
  signInWithGoogle: () => void;
  signOut: () => void;
  requestNotificationPermission: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  isProfileComplete: null,
  signInWithGitHub: () => {},
  signInWithGoogle: () => {},
  signOut: () => {},
  requestNotificationPermission: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const publicRoutes = ['/feed'];
const authRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const requestNotificationPermission = useCallback(async () => {
    if (!messaging || typeof window === 'undefined' || !('Notification' in window) || !user) {
        toast({
            title: "Notifications not supported",
            description: "Your browser does not support push notifications.",
            variant: "destructive"
        });
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const fcmToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
            if (fcmToken) {
                await updateUser(user.uid, { fcmToken });
                toast({
                    title: "Notifications Enabled!",
                    description: "You'll now receive updates from Campus Connect."
                });
            }
        } else {
            toast({
                title: "Notifications Disabled",
                description: "You have not enabled push notifications.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error('An error occurred while setting up push notifications.', error);
        toast({
            title: "Notification Error",
            description: "Something went wrong. Please try again.",
            variant: "destructive"
        });
    }
  }, [user, toast]);

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
            } as Omit<IUser, '_id' | 'university' | 'major' | 'location' | 'gender'>;
            mongoUser = await createUser(newUser as any);
        }
        setDbUser(mongoUser);
        const profileComplete = !!(mongoUser?.university && mongoUser.major && mongoUser.location && mongoUser.gender);
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
    const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/';
    const isProfileRoute = pathname === '/profile';

    if (user) {
      // If user is logged in
      if (pathname === '/') {
        router.push('/feed');
      } else if (isAuthRoute) {
        router.push('/feed');
      } else if (isProfileComplete === false && !isProfileRoute) {
        router.push('/profile');
      }
    } else {
      // If user is not logged in
      if (!isPublicRoute && !isAuthRoute && !isProfileRoute) {
        router.push('/');
      }
    }

  }, [user, isProfileComplete, loading, pathname, router]);

  const signInWithProvider = async (provider: GithubAuthProvider | GoogleAuthProvider) => {
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle user creation and redirects
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast({
        title: 'Authentication Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      // Don't setLoading(false) here, let onAuthStateChanged handle it
    }
  };

  const signInWithGitHub = () => signInWithProvider(new GithubAuthProvider());
  const signInWithGoogle = () => signInWithProvider(new GoogleAuthProvider());

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, isProfileComplete, signInWithGitHub, signInWithGoogle, signOut, requestNotificationPermission }}>
      {children}
    </AuthContext.Provider>
  );
}
