import { auth } from '../firebase.js';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  getIdTokenResult
} from 'firebase/auth';


const DEFAULT_ADMIN_EMAILS = [
  'mahantpal123@gmail.com',
  'gargeemedicose@gmail.com',
  'admin@gargeemedicose.com',
  'mahantpal123@gmail.com'
];

export const getAdminEmails = () => {
  const envEmails = import.meta.env.VITE_ADMIN_EMAILS;
  if (envEmails) {
    return envEmails
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS.map((email) => email.toLowerCase());
};

export const verifyIsAdmin = async (user) => {
  if (!user || !user.email) return false;

  const normalizedEmail = user.email.trim().toLowerCase();
  const allowedEmails = getAdminEmails();

  
  if (allowedEmails.includes(normalizedEmail)) {
    return true;
  }

  
  try {
    const tokenResult = await getIdTokenResult(user, true);
    if (tokenResult?.claims?.admin === true || tokenResult?.claims?.role === 'admin') {
      return true;
    }
  } catch (err) {
    console.warn("Error checking admin claims:", err);
  }

  return false;
};

export const signInAdminWithEmail = async (email, password) => {
  const cleanEmail = email.trim();
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  const user = credential.user;

  const isAuthorized = await verifyIsAdmin(user);
  if (!isAuthorized) {
    await signOut(auth);
    const error = new Error("Access Denied: Your account is not authorized as an Administrator for Gargee Medicose.");
    error.code = 'auth/unauthorized-admin';
    throw error;
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Store Administrator',
    photoURL: user.photoURL || '',
    lastLoginAt: new Date().toISOString()
  };
};

export const signInAdminWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  const isAuthorized = await verifyIsAdmin(user);
  if (!isAuthorized) {
    await signOut(auth);
    const error = new Error("Access Denied: Your Google account (" + (user.email || 'unknown') + ") is not registered as an authorized Admin.");
    error.code = 'auth/unauthorized-admin';
    throw error;
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Store Administrator',
    photoURL: user.photoURL || '',
    lastLoginAt: new Date().toISOString()
  };
};

export const sendAdminPasswordReset = async (email) => {
  const cleanEmail = email.trim();
  const allowedEmails = getAdminEmails();
  if (!allowedEmails.includes(cleanEmail.toLowerCase())) {
    const error = new Error("This email address is not registered in the Admin whitelist.");
    error.code = 'auth/unauthorized-admin';
    throw error;
  }
  return sendPasswordResetEmail(auth, cleanEmail);
};

export const signOutAdmin = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("Sign out admin error:", e);
  }
};
