
'use server';

import { getUser, updateUser } from './user.actions';
import webpush, { type PushSubscription } from 'web-push';

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
}

const vapidPublicKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:contact@campusconnect.com',
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('VAPID keys must be configured for push notifications in production.');
  } else {
    console.warn('VAPID keys are not configured. Push notifications will not work.');
  }
}

export async function sendPushNotification(payload: NotificationPayload): Promise<void> {
  const user = await getUser(payload.userId);

  if (!user || !user.pushSubscription) {
    console.log(`User ${payload.userId} not found or has no push subscription.`);
    return;
  }
  
  if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("VAPID keys not set, skipping push notification.");
      return;
  }

  const subscription = user.pushSubscription as unknown as PushSubscription;

  const notificationData = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/icon-192x192.png',
    data: {
      url: payload.url || '/feed', 
    },
  });

  try {
    await webpush.sendNotification(subscription, notificationData);
  } catch (error: any) {
    console.error('Error sending push notification:', error.statusCode, error.body);
    // If the subscription is gone or invalid (404 or 410), remove it from the database
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('Subscription is no longer valid. Removing from DB.');
      await updateUser(user.uid, { pushSubscription: undefined });
    }
  }
}
