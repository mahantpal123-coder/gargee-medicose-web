import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedCatalog = null;

function getBackupCatalog() {
  try {
    const backupPath = path.join(__dirname, '..', 'backup', 'settings.json');
    if (fs.existsSync(backupPath)) {
      const docs = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      const store = Array.isArray(docs) ? docs.find((d) => d.id === 'store_config') : null;
      if (store) return store;
    }
  } catch (e) {
    console.warn('Backup catalog read note:', e.message);
  }
  return null;
}

function initFirebaseAdmin() {
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
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      return admin;
    } catch (e) {
      console.warn('Firebase Admin init note:', e.message);
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(
        `SELECT value FROM settings WHERE key_name = 'store_config'`
      );
      if (rows.length > 0) {
        const value = rows[0].value;
        cachedCatalog = typeof value === 'string' ? JSON.parse(value) : value;
      }
    } catch (e) {
      console.warn('Error reading catalog from Hostinger MySQL:', e.message);
    }

    if (!cachedCatalog) {
      cachedCatalog = getBackupCatalog();
    }

    return res.status(200).json({
      success: true,
      data: cachedCatalog,
      updatedAt: cachedCatalog?.updatedAt || null
    });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const adminApp = initFirebaseAdmin();
    if (adminApp) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const adminEmails = (process.env.VITE_ADMIN_EMAILS || '')
          .split(',')
          .map((e) => e.trim().toLowerCase());
        const userEmail = (decodedToken.email || '').toLowerCase();

        if (!adminEmails.includes(userEmail) && decodedToken.admin !== true && decodedToken.role !== 'admin') {
          return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
        }
      } catch (err) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
      }
    }

    const { products, categories, businessInfo, orders, inquiries } = req.body || {};
    cachedCatalog = {
      products: products || cachedCatalog?.products || [],
      categories: categories || cachedCatalog?.categories || [],
      businessInfo: businessInfo || cachedCatalog?.businessInfo || null,
      orders: orders || cachedCatalog?.orders || [],
      inquiries: inquiries || cachedCatalog?.inquiries || [],
      updatedAt: new Date().toISOString()
    };

    try {
      await pool.query(
        `INSERT INTO settings (key_name, value) VALUES ('store_config', ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [JSON.stringify(cachedCatalog)]
      );
    } catch (e) {
      console.warn('Error saving catalog to Hostinger MySQL:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Catalog updated successfully in Hostinger MySQL',
      data: cachedCatalog
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
