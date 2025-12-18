
'use server';

import { firestore } from '@/lib/firebase';
import { IMessage } from '@/types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
  };

  const docRef = await addDoc(messagesCollection, newMessageData);

  return {
    _id: docRef.id,
    conversationId,
    from: fromUid,
    to: toUid,
    text,
    createdAt: new Date(), // This is an approximation, client-side date
  };
}
