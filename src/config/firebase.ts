import admin from 'firebase-admin';
const serviceAccount = require('./ehealth-b41ee-firebase-adminsdk-fbsvc-968dc3fe8e.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const fcmAdmin = admin;
