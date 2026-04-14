import admin from 'firebase-admin';
import { env } from './env';

let firebaseInitialized = false;

const initFirebase = () => {
    try {
        const config = env.firebaseServiceAccount;
        if (!config || config === '{}') {
            console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT chưa cấu hình — Push Notification sẽ không hoạt động.");
            return;
        }
        const serviceAccount = JSON.parse(config);
        if (!serviceAccount.project_id) {
            console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT thiếu project_id — Push Notification sẽ không hoạt động.");
            return;
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        firebaseInitialized = true;
        console.log("✅ Firebase Admin SDK đã khởi tạo thành công.");
    } catch (error: any) {
        console.warn("⚠️  Firebase init thất bại:", error.message, "— Push Notification sẽ không hoạt động.");
    }
};

initFirebase();

export const fcmAdmin = admin;
export const isFirebaseReady = () => firebaseInitialized;