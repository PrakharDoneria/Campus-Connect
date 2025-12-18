
'use server';

import * as admin from 'firebase-admin';

let adminApp: admin.app.App;
let messaging: admin.messaging.Messaging;

const serviceAccount = {
  "type": "service_account",
  "project_id": "connect-with-clg-campus",
  "private_key_id": "0f19e012d66076a50b4238aac0b32e2dd4a527ef",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDL1y+xMY/jEdeH\nSUqxM6SopSA9PNCXBFsdOmsP7uJ4zZ5UA7VwLgDfUPaDYEUh/c8l4rGwt1XXZGiA\nXufIgvoF9llEyx0Sj/8ZijcvLsg1HH0XPuoa6KKL2gsVlbowXYV0tiMxyoE0reYB\nigZa/rtVxZajmgdttwDwNUQPKE0iUtk6A/jDt3Whd66cSddzabCUMW4vly/+d28N\nVZw9FyLlhWAT3X1CQ641sGkC/vUdCIwgRUtfa4NG5LEMS1cSmvbP4BR4yFJpxD+B\nwdrurO7SPMGAi/iopB/bhvQeNDoJWCUgT8vImAxvL/rgxT59c8ErPOGsBGljIWGV\nyUQyZGJ5AgMBAAECggEAASQIOE8ZPSQz0q0fc6aA4QYC/f72nie9br27xbwfvpX3\nOFpIrtaFEd5ssaL/PrbUHossDdD/SY4B3eAoUJswQzUHjI7F7/KWUwMOxPm7D8uV\nulnzWpWAye2LhqQF6TXojXFdcdzZBh9vLuh+fSOSVfTzKgTq8gfPMf5G/GHJCYAO\n1Da/ujK8BZES4aaIvBH3j6+TmgoeSBBmpFWCpr4/YLvhAmoFMJq1/UfTpd8Dlrlr\nsZoBdEudDhEo3QKycSLKiEne2WbBOOlbTanGMugmllMqqtyr7A7inbh+CGuGVWIC\nGpSyqj6s2ulexeiXGR1ei0QSG9QRFKRM/IAC7dLbUQKBgQDwF42kUA78aUMNZI8r\nzPUW6swbjcGF40MAMa2oYGoG/OHf+MUcXMKIZJ4hiiOPlQECz5YBpzmj3dxO8FCE\nj+KySwDpwlwT3n+Vge/qrfiJCvteV9mhsP9PxCULe1Lm0MuK14VBsHqyPdvw/O8c\nO37CZw3UyFf7prcsqIdUPRX7MQKBgQDZWLw6kN1qjhRsITW5X17/IgYga+CM2OnH\nMbatzFMPflM8Rex6P2Rx7vExke4WGAr3nLles4rsXK1/lmgwXMSx2uFgwNbunSrI\n/PbYK+iWMJeQ9GauIlitbYTiNj5IPlS2zR9UW/1yNoW1uPdfCzxInHQfiz6si76a\nn9bzdOh5yQKBgDw/zN2U8Y3J5Hex6nO1ZTOxDDNF6XBtzVx5GvkL6M+EGjKYPO6X\nIIIVrdEA11eqrqxD54LWshI7FJQCnlIFwX+4bqw6h9y8kwuzpb8glSPey6GrLgPz\nZL5hnGI7OlyNvOZEmz4WyVN9Tno1HtPY4kBql//znpCaD5F3YS50fdWhAoGBANB6\nhDqtICWIWWCKzmycZZPWgAfzUjXoDv4p2m+FMRsIcjC7ZaSxT9jVeHey4axBratr\nooeLMrOcBjP/Art5EJcFO/BBqSjCivq1YtVh8Ly3qXq6ZA+eFG9uQOt3WnCTkVCz\nGt0hS8+VKtZvsKBzN4TyxZRITXrWpKLOtTFbr265AoGAcApDoGIcI/UUtN1FSqD3\ndpoDLNnRKCWTcUQjxb59lccGR86Uj0fzmf5+qMoa8nTrkGDLp5D9LlY6ZWFOP9JL\nNvloy7JmxJc5gcSX6WxnZDwMysFH8tt0a8HwFssuoILBw2kRSp87cjeAuKY0CIcF\n5dSNNjsWRp/bt6zjuGRBv+c=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@connect-with-clg-campus.iam.gserviceaccount.com",
  "client_id": "107459538254318473928",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40connect-with-clg-campus.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

export async function getAdminApp() {
  if (adminApp) {
    return adminApp;
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
