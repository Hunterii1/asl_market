// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD1PzmVAhZ8Wnb2zkbVXSRpcohKeKO3bmw",
  authDomain: "asll-d7594.firebaseapp.com",
  projectId: "asll-d7594",
  storageBucket: "asll-d7594.firebasestorage.app",
  messagingSenderId: "484888304392",
  appId: "1:484888304392:web:5f23e95823fbf814772abd",
  measurementId: "G-3SRDNLZGGJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Firebase Messaging initialization error:', error);
  }
}

export { app, analytics, messaging };

