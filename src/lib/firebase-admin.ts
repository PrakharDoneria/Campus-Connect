
'use server';

import * as admin from 'firebase-admin';

let adminApp: admin.app.App;
let messaging: admin.messaging.Messaging;

export async function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountString) {
    throw new Error('Firebase service account key is not configured in environment variables.');
  }

  let serviceAccount;
  try {
    // Decode the Base64 string to get the original JSON string
    const decodedString = Buffer.from(serviceAccountString, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decodedString);
  } catch (e) {
    console.error("Failed to decode or parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it's a valid Base64-encoded JSON string.", e);
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

export async function getMessaging() {
    if (!messaging) {
        const app = await getAdminApp();
        messaging = app.messaging();
    }
    return messaging;
}
