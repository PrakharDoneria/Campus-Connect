
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

  if (!user) {
    console.log(`[Push Notification] User ${payload.userId} not found in database.`);
    return;
  }

  if (!user.pushSubscription) {
    console.log(`[Push Notification] User ${payload.userId} has not enabled push notifications. Subscription is missing.`);
    return;
  }
  
  if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("[Push Notification] VAPID keys not configured. Please run 'npx web-push generate-vapid-keys' and add them to your .env file.");
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
    console.log(`[Push Notification] Successfully sent notification to user ${payload.userId}: "${payload.title}"`);
  } catch (error: any) {
    console.error('[Push Notification] Error sending notification:', {
      userId: payload.userId,
      statusCode: error.statusCode,
      message: error.message,
      body: error.body
    });
    
    // If the subscription is gone or invalid (404 or 410), remove it from the database
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log(`[Push Notification] Subscription expired for user ${payload.userId}. Removing from database.`);
      await updateUser(user.uid, { pushSubscription: undefined });
    }
  }
}
