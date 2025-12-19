
'use server';

import { getUser } from './user.actions';

interface NotificationPayload {
    userId: string;
    title: string;
    body: string;
}

export async function sendPushNotification(payload: NotificationPayload): Promise<void> {
    const user = await getUser(payload.userId);
    
    if (!user || !user.pushSubscription) {
        console.log(`User ${payload.userId} not found or has no push subscription.`);
        return;
    }

    console.log(`--- Sending Push Notification ---`);
    console.log(`To: ${user.name} (${user.uid})`);
    console.log(`Title: ${payload.title}`);
    console.log(`Body: ${payload.body}`);
    console.log(`Subscription Info:`, user.pushSubscription);
    console.log(`---------------------------------`);
    
    // In a real application, you would add a backend service here
    // to take the 'user.pushSubscription' object and send the actual push
    // notification via a service like Firebase Admin SDK, web-push, etc.
    //
    // Example using a hypothetical backend endpoint:
    //
    // try {
    //   const response = await fetch('https://your-backend.com/send-notification', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       subscription: user.pushSubscription,
    //       payload: {
    -        // Vercel doesn't support FCM, so we use a different service.
    -        const response = await fetch('https://fcm-push-one.vercel.app/send-notification', {
    -            method: 'POST',
    -            headers: {
    -                'Content-Type': 'application/json',
    -                // Vercel needs a user-agent
    -                'User-Agent': 'CampusConnect/1.0',
    -            },
    -            body: JSON.stringify({
    -                token: user.fcmToken,
    -                title: payload.title,
    -                body: payload.body,
    -            }),
    -        });
    -
    -        if (!response.ok) {
    -            const errorBody = await response.text();
    -            console.error('Failed to send push notification:', response.status, errorBody);
    -        }
    //       }
    //     })
    //   });
    //
    //   if (!response.ok) {
    //     throw new Error(`Notification send failed with status: ${response.status}`);
    //   }
    // } catch (error) {
    //   console.error("Error sending push notification:", error);
    // }

    return Promise.resolve();
}
