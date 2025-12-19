
'use client';

import { auth, firestore } from '@/lib/firebase';
import { User, onAuthStateChanged, signInWithPopup, GithubAuthProvider, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getUser, createUser } from '@/lib/actions/user.actions';
import type { IUser } from '@/types';
import { useToast } from './use-toast';
import LoadingScreen from '@/components/common/LoadingScreen';
import { collection, query, where, onSnapshot } from 'firebase/firestore';


interface AuthContextType {
  user: User | null;
  dbUser: IUser | null;
  loading: boolean;
  isProfileComplete: boolean | null;
  signInWithGitHub: () => void;
  signInWithGoogle: () => void;
  signOut: () => void;
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
    
    // Allow access to public profile pages
    const isPublicProfileRoute = /^\/profile\/[a-zA-Z0-9]+$/.test(pathname);
    const isSearchRoute = pathname === '/search';

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
      if (!isPublicRoute && !isPublicProfileRoute && pathname !== '/friends' && pathname !== '/messages' && !isSearchRoute) {
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
    <AuthContext.Provider value={{ user, dbUser, loading, isProfileComplete, signInWithGitHub, signInWithGoogle, signOut, unreadMessagesCount, friendRequestCount }}>
      {children}
    </AuthContext.Provider>
  );
}
