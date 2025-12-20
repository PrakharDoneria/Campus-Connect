# Push Notifications Setup Guide

Campus Connect uses **Web Push API with VAPID** (Voluntary Application Server Identification) for sending push notifications to users. This guide explains how to set up and troubleshoot the push notification system.

## Architecture Overview

The notification system consists of three main components:

1. **Service Worker** (`/public/firebase-messaging-sw.js`)
   - Handles incoming push events
   - Displays notifications to users
   - Manages notification clicks

2. **Client-Side Subscription** (`src/hooks/use-auth.tsx`)
   - Requests notification permission from users
   - Subscribes to push notifications via Push Manager
   - Stores subscription in the database

3. **Server-Side Delivery** (`src/lib/actions/notification.actions.ts`)
   - Uses `web-push` library to send notifications
   - Validates subscriptions and removes invalid ones

## Initial Setup

### 1. Generate VAPID Keys

VAPID keys are required for the Web Push protocol. Generate a new pair using:

```bash
npx web-push generate-vapid-keys
```

This will output something like:

```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib27SDbQOVjqZvmcZk3o...
Private Key:
q1dXpw6YH3irbfKzRjQT_Rvpq6FdNyFxkbZrD1Zvj...
=======================================
```

### 2. Configure Environment Variables

Add the generated keys to your `.env` file:

```bash
# Public key (will be sent to the client)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib27SDbQOVjqZvmcZk3o...

# Private key (kept secret on server)
VAPID_PRIVATE_KEY=q1dXpw6YH3irbfKzRjQT_Rvpq6FdNyFxkbZrD1Zvj...
```

**Important Notes:**
- Despite the name `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, this is a standard Web-Push VAPID key, NOT a Firebase Cloud Messaging key
- The keys MUST be generated as a matching pair using the `web-push` library
- NEVER commit the private key to version control
- The public key is safe to expose to clients

### 3. Verify Icon Assets

Ensure the notification icons exist in the `/public` directory:
- `/public/icon-192x192.png` - Main notification icon
- `/public/badge-72x72.png` - Badge icon for notification bar

These icons are automatically created during setup. If missing, they will cause notifications to fail on some browsers.

## How It Works

### User Flow

1. **Permission Request**: When a user visits the app on mobile, after 3 seconds, they see a dialog asking to enable notifications (if permission is still "default")

2. **Service Worker Registration**: The service worker is registered when the app loads (in `src/app/layout.tsx`)

3. **Push Subscription**: When the user grants permission:
   - The app subscribes to push notifications via `pushManager.subscribe()`
   - The subscription object (including endpoint and keys) is saved to the user's database record
   - A test notification is sent after 5 seconds

4. **Receiving Notifications**: When a notification is sent:
   - Server calls `sendPushNotification()` with user ID, title, body, and optional URL
   - Server retrieves user's subscription from database
   - Server uses `web-push` to send notification to the browser's push service
   - Service worker receives the push event and displays the notification

5. **Notification Click**: When user clicks the notification:
   - Service worker opens/focuses the specified URL
   - Default URL is `/feed`

### Database Storage

Push subscriptions are stored in the `users` collection as `pushSubscription` field:

```typescript
{
  endpoint: "https://fcm.googleapis.com/fcm/send/...",
  keys: {
    p256dh: "...",
    auth: "..."
  }
}
```

## Testing Notifications

### Manual Test

After a user enables notifications, a test notification is automatically sent after 5 seconds with the message "Welcome to Campus Connect!".

### Triggering Custom Notifications

Use the `sendPushNotification` function from your server actions:

```typescript
import { sendPushNotification } from '@/lib/actions/notification.actions';

await sendPushNotification({
  userId: 'user_uid_here',
  title: 'New Friend Request',
  body: 'John Doe wants to connect with you',
  url: '/friends', // Optional, defaults to '/feed'
});
```

## Troubleshooting

### "User has no push subscription"

**Cause**: The user hasn't granted notification permission or the subscription wasn't saved to the database.

**Solutions**:
1. Verify the user clicked "Enable Notifications" in the prompt
2. Check browser console for errors during subscription
3. Verify VAPID public key is correctly set in environment variables
4. Check the user's document in MongoDB for a `pushSubscription` field

### Subscription Errors (410 Gone / 404 Not Found)

**Cause**: The push subscription has expired or been invalidated.

**Solution**: The system automatically removes invalid subscriptions. User needs to re-enable notifications.

### Notifications Not Appearing

**Possible causes**:
1. **Missing icons**: Verify `/icon-192x192.png` and `/badge-72x72.png` exist
2. **Browser doesn't support notifications**: Check `'Notification' in window`
3. **Service worker not registered**: Check browser DevTools > Application > Service Workers
4. **Permission denied**: User needs to reset browser notification settings

### VAPID Keys Not Working

**Symptoms**: Errors like "UnauthorizedRegistration" or authentication failures

**Solutions**:
1. Regenerate VAPID keys as a matching pair: `npx web-push generate-vapid-keys`
2. Ensure both public and private keys are from the same generation
3. Verify no extra whitespace in environment variables
4. Restart the development server after changing environment variables

### Service Worker Not Updating

**Solution**: In development:
1. Open DevTools > Application > Service Workers
2. Check "Update on reload"
3. Click "Unregister" and reload the page

## Security Considerations

1. **Private Key Protection**: Never expose `VAPID_PRIVATE_KEY` in client-side code or commit it to version control

2. **HTTPS Required**: Push notifications only work over HTTPS (or localhost for development)

3. **Subscription Validation**: The system automatically removes invalid subscriptions when they return 404/410 errors

4. **User Consent**: Notifications are only sent to users who have explicitly granted permission

## Browser Support

Web Push is supported in:
- Chrome/Edge 42+
- Firefox 44+
- Safari 16+ (macOS 13+, iOS 16.4+)
- Opera 29+

Note: iOS Safari has limited support and requires specific configurations.

## Production Checklist

Before deploying to production:

- [ ] Generate production VAPID keys (different from development)
- [ ] Set VAPID keys in production environment variables
- [ ] Verify notification icons are in `/public` directory
- [ ] Test notification flow on mobile devices
- [ ] Ensure HTTPS is enabled
- [ ] Update contact email in `notification.actions.ts` if needed (currently: contact@campusconnect.com)
- [ ] Test subscription persistence across page reloads
- [ ] Verify expired subscription cleanup works

## Advanced Configuration

### Customizing Notification Behavior

Edit `/public/firebase-messaging-sw.js` to customize:
- Notification appearance (icon, badge, vibration pattern)
- Click behavior
- Action buttons
- Silent notifications

### Notification Triggers

Common events that trigger notifications:
- New friend requests
- New messages
- Post interactions (likes, comments)
- Event reminders

Add notification triggers by calling `sendPushNotification()` in the appropriate server actions.

## Resources

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [web-push library documentation](https://github.com/web-push-libs/web-push)
- [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
