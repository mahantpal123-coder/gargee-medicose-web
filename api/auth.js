import admin from 'firebase-admin';

let adminApp = null;

function getFirebaseAdmin() {
  if (adminApp) return adminApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey })
        });
      }
      adminApp = admin;
      return adminApp;
    } catch (e) {
      console.warn('Firebase Admin init note:', e.message);
    }
  }
  return null;
}

/**
 * Middleware: verifies Firebase ID token and attaches user to req.
 * Returns 401 if token is missing/invalid.
 */
export async function requireAuth(req, res, next) {
  // API key auth for desktop dashboard
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.DASHBOARD_API_KEY;
  if (apiKey && validKey && apiKey === validKey) {
    req.user = { email: 'dashboard@gargeemedicose.com', role: 'admin', admin: true };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  const app = getFirebaseAdmin();
  if (!app) {
    return res.status(500).json({ success: false, error: 'Auth service unavailable' });
  }

  try {
    const decoded = await app.auth().verifyIdToken(idToken);
    req.user = decoded;

    const adminEmails = (process.env.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase());

    const email = (decoded.email || '').toLowerCase();
    const isAdmin =
      adminEmails.includes(email) ||
      decoded.admin === true ||
      decoded.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
  }
}
