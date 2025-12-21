'use server';

import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';

/**
 * Deletes messages that were read and are older than 24 hours.
 * This is intended to be run as a scheduled job (e.g., a cron job).
 */
export async function deleteOldMessages(): Promise<{ deletedCount: number }> {
  console.log('Running job to delete old messages...');

  const messagesRef = collection(firestore, 'messages');
  
  // Calculate the timestamp for 24 hours ago
  const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

  // Query for messages that are read and older than 24 hours
  const q = query(
    messagesRef,
    where('read', '==', true),
    where('createdAt', '<=', twentyFourHoursAgo)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log('No old messages to delete.');
    return { deletedCount: 0 };
  }

  // Use a batch to delete all documents in a single atomic operation
  const batch = writeBatch(firestore);
  querySnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  
  console.log(`Successfully deleted ${querySnapshot.size} old messages.`);

  return { deletedCount: querySnapshot.size };
}
