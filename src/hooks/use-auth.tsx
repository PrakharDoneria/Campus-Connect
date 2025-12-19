
'use client';

import { auth, firestore } from '@/lib/firebase';
import { User, onAuthStateChanged, signInWithPopup, GithubAuthProvider, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getUser, createUser, updateUser } from '@/lib/actions/user.actions';
import type { IUser } from '@/types';
import { useToast } from './use-toast';
import LoadingScreen from '@/components/common/LoadingScreen';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { urlBase64ToUint8Array } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  dbUser: IUser | null;
  loading: boolean;
  isProfileComplete: boolean | null;
  signInWithGitHub: () => void;
  signInWithGoogle: () => void;
  signOut: () => void;
  requestNotificationPermission: () => void;
  unreadMessagesCount: number;
  friendRequestCount: number;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  isProfileComplete: null,
  signInWithGitHub: () => {},
  signInWithGoogle: () => {},
  signOut: () => {},
  requestNotificationPermission: () => {},
  unreadMessagesCount: 0,
  friendRequestCount: 0,
});

export const useAuth = () => useContext(AuthContext);

const publicRoutes = ['/feed'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
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
                friends: [],
                friendRequestsSent: [],
                friendRequestsReceived: [],
                blockedUsers: [],
            } as Partial<IUser>;
            mongoUser = await createUser(newUser);
        }
        setDbUser(mongoUser);
        setFriendRequestCount(mongoUser.friendRequestsReceived?.length || 0);
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

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !dbUser) {
      toast({
        title: "Unsupported",
        description: "Push notifications are not supported in this browser or you're not logged in.",
        variant: "destructive",
      });
      return;
    }
  
    if (Notification.permission === 'granted') {
      toast({ title: "Already Enabled", description: "You've already enabled notifications." });
      return;
    }
  
    if (Notification.permission === 'denied') {
      toast({
        title: "Permission Denied",
        description: "You have blocked notifications. Please enable them in your browser settings.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted.');
      }
  
      console.log('Notification permission granted.');
      
      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      console.log('Service worker is ready.');
      
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        throw new Error('VAPID key is not defined.');
      }
      
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
  
      console.log('Push subscription successful:', subscription);
      
      await updateUser(dbUser.uid, { pushSubscription: subscription.toJSON() });
      
      toast({
        title: "Notifications Enabled!",
        description: "You'll now receive updates from Campus Connect.",
      });
  
    } catch (error: any) {
      console.error('Failed to subscribe to push notifications:', error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Could not enable notifications. Please try again.",
        variant: "destructive",
      });
    }
  }, [dbUser, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, [handleUser]);

  useEffect(() => {
    if (!dbUser) {
      setUnreadMessagesCount(0);
      return;
    }

    const messagesRef = collection(firestore, 'messages');
    const q = query(messagesRef, where('to', '==', dbUser.uid), where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const unreadConversations = new Set<string>();
        snapshot.forEach(doc => {
            unreadConversations.add(doc.data().conversationId);
        });
        setUnreadMessagesCount(unreadConversations.size);
    });

    return () => unsubscribe();
  }, [dbUser]);


  useEffect(() => {
    if (loading) return;

    const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/';
    const isProfileEditRoute = pathname === '/profile/edit';
    
    const isPublicProfileRoute = /^\/profile\/[a-zA-Z0-9]+$/.test(pathname);
    const isSearchRoute = pathname === '/search';

    if (user) {
      if (isProfileComplete === true) {
        if (pathname === '/') {
          router.push('/feed');
        }
      } else if (isProfileComplete === false && !isProfileEditRoute) {
        router.push('/profile/edit');
      }
    } else {
      if (!isPublicRoute && !isPublicProfileRoute && pathname !== '/friends' && !pathname.startsWith('/messages') && !isSearchRoute) {
        router.push('/');
      }
    }

  }, [user, isProfileComplete, loading, pathname, router]);

  const signInWithProvider = async (provider: GithubAuthProvider | GoogleAuthProvider) => {
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast({
        title: 'Authentication Error',
        description: error.message,
        variant: 'destructive',
      });
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
    <AuthContext.Provider value={{ user, dbUser, loading, isProfileComplete, signInWithGitHub, signInWithGoogle, signOut, requestNotificationPermission, unreadMessagesCount, friendRequestCount }}>
      {children}
    </AuthContext.Provider>
  );
}
