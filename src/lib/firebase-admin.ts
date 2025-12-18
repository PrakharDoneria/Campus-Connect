
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

let adminApp: admin.app.App;
let messaging: admin.messaging.Messaging;

export function getAdminApp() {
  if (!serviceAccount) {
    throw new Error('Firebase service account key is not configured.');
  }

  if (!adminApp) {
    if (admin.apps.length > 0) {
      adminApp = admin.app();
    } else {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }
  return adminApp;
}

export function getMessaging() {
    if (!messaging) {
        messaging = getAdminApp().messaging();
    }
    return messaging;
}
