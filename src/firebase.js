import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const getFirebaseConfig = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const customConfig = localStorage.getItem("gargee_firebase_config");
      if (customConfig) {
        const parsed = JSON.parse(customConfig);
        if (parsed?.apiKey && parsed?.projectId) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error("Failed to parse custom firebase config:", e);
  }

  const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};

  return {
    apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBvXvVCvSqIMR_w_R12e48fqKQceCAa3m8",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gargee-1d0ec.firebaseapp.com",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "gargee-1d0ec",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gargee-1d0ec.firebasestorage.app",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "306357708775",
    appId: env.VITE_FIREBASE_APP_ID || "1:306357708775:web:cde14ae256c6ad976dbf42",
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-XQK129E0QQ"
  };
};

export const isFirebaseConfigured = () => {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId);
};

export const saveFirebaseConfig = (config) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("gargee_firebase_config", JSON.stringify(config));
  }
};

export const clearFirebaseConfig = () => {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("gargee_firebase_config");
  }
};

export const app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

