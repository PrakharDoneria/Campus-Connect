
'use server';

const NOTIFICATION_API_URL = 'https://fcm-push-one.vercel.app/send-notification';

interface NotificationPayload {
    token: string;
    title: string;
    body: string;
}

export async function sendPushNotification({ token, title, body }: NotificationPayload): Promise<void> {
    if (!token) {
        console.warn("Attempted to send notification but no FCM token was provided.");
        return;
    }
    
    try {
        const response = await fetch(NOTIFICATION_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CampusConnect/1.0',
            },
            body: JSON.stringify({
                token,
                title,
                body,
            }),
        });
        
        const responseData = await response.json();

        if (!response.ok) {
            console.error('Failed to send push notification:', responseData.error || response.statusText);
        } else {
            console.log('Push notification sent successfully:', responseData.message_id);
        }

    } catch (error) {
        console.error('An error occurred while sending push notification:', error);
    }
}
