
'use server';

import { firestore } from '@/lib/firebase';
import { IMessage } from '@/types';
import { collection, addDoc, serverTimestamp, writeBatch, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { getUser } from './user.actions';
import { sendPushNotification } from './notification.actions';

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
  const [fromUser, toUser] = await Promise.all([
      getUser(fromUid),
      getUser(toUid)
  ]);

  if (toUser && fromUser) {
      await sendPushNotification({
          userId: toUser.uid,
          title: fromUser.name,
          body: text,
      });
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
