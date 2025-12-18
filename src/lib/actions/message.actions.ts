
'use server';

import { firestore } from '@/lib/firebase';
import { IMessage } from '@/types';
import { collection, addDoc, serverTimestamp, writeBatch, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { getUser } from './user.actions';
import { getAdminApp, getMessaging } from '../firebase-admin';

export async function sendMessage(fromUid: string, toUid: string, text: string): Promise<IMessage> {
  if (!fromUid || !toUid || !text.trim()) {
    throw new Error('Missing required fields for sending a message.');
  }

  const conversationId = [fromUid, toUid].sort().join('_');
  const messagesCollection = collection(firestore, 'messages');

  const newMessageData = {
    conversationId,
    from: fromUid,
    to: toUid,
    text,
    createdAt: serverTimestamp(),
    read: false,
  };

  const docRef = await addDoc(messagesCollection, newMessageData);

  // Send push notification
  try {
    const [fromUser, toUser] = await Promise.all([
        getUser(fromUid),
        getUser(toUid)
    ]);

    if (toUser?.fcmToken && fromUser) {
        getAdminApp(); // Ensure admin app is initialized
        const messaging = getMessaging();
        
        const messagePayload = {
            notification: {
                title: fromUser.name,
                body: text,
            },
            token: toUser.fcmToken,
            webpush: {
              fcmOptions: {
                link: `${process.env.NEXT_PUBLIC_BASE_URL}/messages?with=${fromUid}`
              }
            }
        };
        await messaging.send(messagePayload);
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);
    // We don't throw here because the message was still sent successfully.
  }

  return {
    _id: docRef.id,
    conversationId,
    from: fromUid,
    to: toUid,
    text,
    read: false,
    createdAt: new Date(), // This is an approximation, client-side date
  };
}


export async function markConversationAsRead(conversationId: string, currentUserId: string): Promise<void> {
  const messagesRef = collection(firestore, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    where('to', '==', currentUserId),
    where('read', '==', false)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return;
  }

  const batch = writeBatch(firestore);
  querySnapshot.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
}

export async function deleteMessage(messageId: string): Promise<void> {
    const messageRef = doc(firestore, 'messages', messageId);
    await deleteDoc(messageRef);
}

export async function deleteConversation(conversationId: string): Promise<void> {
    const messagesRef = collection(firestore, 'messages');
    const q = query(messagesRef, where('conversationId', '==', conversationId));
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return;
    }
    
    const batch = writeBatch(firestore);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
}
    

    
