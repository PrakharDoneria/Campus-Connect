
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleFcmToken = useCallback(async (uid: string) => {
    if (!messaging || typeof window === 'undefined' || !('Notification' in window)) {
        return;
    }
    try {
        const currentPermission = Notification.permission;
        if (currentPermission === 'granted') {
            const fcmToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
            if (fcmToken) {
                await updateUser(uid, { fcmToken });
            }
        }
    } catch (error) {
        console.error('An error occurred while handling FCM token.', error);
    }
  }, []);

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
            await handleFcmToken(user.uid);
            toast({
                title: "Notifications Enabled!",
                description: "You'll now receive updates from Campus Connect."
            });
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
  }, [user, toast, handleFcmToken]);

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
                friends: [],
                friendRequestsSent: [],
                friendRequestsReceived: [],
            } as Partial<IUser>;
            mongoUser = await createUser(newUser);
        }
        setDbUser(mongoUser);
        const profileComplete = !!(mongoUser?.university && mongoUser.major && mongoUser.location && mongoUser.gender);
        setIsProfileComplete(profileComplete);

        if (profileComplete) {
            await handleFcmToken(firebaseUser.uid);
        }

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
  }, [handleFcmToken]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, [handleUser]);

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/';
    const isProfileEditRoute = pathname === '/profile/edit';
    
    // Allow access to public profile pages
    const isPublicProfileRoute = /^\/profile\/[a-zA-Z0-9]+$/.test(pathname);

    if (user) {
      if (isProfileComplete === false && !isProfileEditRoute) {
        // If profile is not complete, redirect to the edit page.
        router.push('/profile/edit');
      } else if (isProfileComplete === true && isProfileEditRoute && !dbUser?.university) {
        // This case handles when the user is on the edit page but the profile is already complete
        // but it's their first time. We let them stay.
      } else if (pathname === '/') {
        router.push('/feed');
      }
    } else {
      // If user is not logged in
      if (!isPublicRoute && !isPublicProfileRoute && pathname !== '/friends') {
        router.push('/');
      }
    }

  }, [user, isProfileComplete, loading, pathname, router, dbUser]);

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
