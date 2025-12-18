
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;
let messaging: admin.messaging.Messaging;

export function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountString) {
    throw new Error('Firebase service account key is not configured in environment variables.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountString);
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it's a valid JSON string.", e);
    throw new Error("Firebase service account key is malformed.");
  }


  if (admin.apps.length > 0) {
    adminApp = admin.app();
  } else {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  
  return adminApp;
}

export function getMessaging() {
    if (!messaging) {
        messaging = getAdminApp().messaging();
    }
    return messaging;
}
