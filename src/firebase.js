import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gargee-1d0ec.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "gargee-1d0ec",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gargee-1d0ec.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "306357708775",
  appId: env.VITE_FIREBASE_APP_ID || "1:306357708775:web:cde14ae256c6ad976dbf42",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-XQK129E0QQ"
};

export const isFirebaseConfigured = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

