import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import sendOrderHandler from './api/send-order.js';
import sendReturnHandler from './api/send-return.js';
import sendInquiryHandler from './api/send-inquiry.js';
import catalogHandler from './api/catalog.js';
import productsHandler from './api/products.js';
import { requireAuth } from './api/auth.js';
import ordersHandler, { trackOrderHandler, customerOrdersHandler, claimCustomerOrdersHandler } from './api/orders.js';
import { createRazorpayOrderHandler, verifyRazorpayPaymentHandler } from './api/razorpay.js';
import { createShipmentHandler, generateLabelHandler, assignCourierHandler, trackShipmentHandler, checkServiceabilityHandler, shiprocketWebhookHandler } from './api/shiprocket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

const app = express();

app.disable('x-powered-by');

// Simple In-Memory Sliding-Window Rate Limiter
const rateLimitStore = new Map();

function rateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const message = options.message || { success: false, error: 'Too many requests, please try again later.' };

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    rateLimitStore.set(key, record);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json(message);
    }

    next();
  };
}

// Cleanup rate limit store every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    // Razorpay checkout.js and its iframes are blocked without these origins.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com https://checkout.razorpay.com; " +
    // Google sign-in opens a cross-origin popup, so Firebase/Google auth
    // domains must be framable as well as Razorpay's.
    "frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://*.firebaseapp.com https://accounts.google.com https://*.google.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://accounts.google.com https://*.google.com wss://*.firebaseio.com https://formsubmit.co;"
  );
  next();
});

const frontendOrigin = process.env.FRONTEND_ORIGIN;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (frontendOrigin && origin === frontendOrigin) {
      return callback(null, true);
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (!frontendOrigin) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// Rate limit rules
const strictLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 15, message: { success: false, error: 'Too many submissions. Please wait 15 minutes before trying again.' } });
const orderLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 5, message: { success: false, error: 'Too many order attempts. Please wait 15 minutes before trying again.' } });
const generalApiLimiter = rateLimiter({ windowMs: 1 * 60 * 1000, max: 60, message: { success: false, error: 'Too many requests. Please slow down.' } });

app.use('/api/', generalApiLimiter);

app.post('/api/send-order', strictLimiter, sendOrderHandler);
app.post('/api/send-return', strictLimiter, sendReturnHandler);
app.post('/api/send-inquiry', strictLimiter, sendInquiryHandler);

app.post('/api/create-razorpay-order', strictLimiter, createRazorpayOrderHandler);
app.post('/api/verify-razorpay-payment', strictLimiter, verifyRazorpayPaymentHandler);

app.post('/api/orders/track', strictLimiter, trackOrderHandler);
app.get('/api/customer/orders', customerOrdersHandler);
app.post('/api/customer/orders/claim', strictLimiter, claimCustomerOrdersHandler);

app.get('/api/catalog', catalogHandler);
app.post('/api/catalog', strictLimiter, catalogHandler);
app.put('/api/catalog', strictLimiter, catalogHandler);

app.get('/api/products', productsHandler);
app.post('/api/products', strictLimiter, requireAuth, productsHandler);
app.put('/api/products', strictLimiter, requireAuth, productsHandler);
app.delete('/api/products', strictLimiter, requireAuth, productsHandler);

app.get('/api/orders', ordersHandler);
app.post('/api/orders', orderLimiter, ordersHandler);
app.put('/api/orders', strictLimiter, requireAuth, ordersHandler);
app.delete('/api/orders', strictLimiter, requireAuth, ordersHandler);

// Shiprocket Shipping Routes
app.post('/api/shiprocket/create-order', strictLimiter, requireAuth, createShipmentHandler);
app.post('/api/shiprocket/generate-label', strictLimiter, requireAuth, generateLabelHandler);
app.post('/api/shiprocket/assign-courier', strictLimiter, requireAuth, assignCourierHandler);
app.get('/api/shiprocket/track', generalApiLimiter, trackShipmentHandler);
app.get('/api/shiprocket/serviceability', generalApiLimiter, checkServiceabilityHandler);
app.post('/api/shiprocket/webhook', generalApiLimiter, shiprocketWebhookHandler);

app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
  res.status(500).send('Internal Server Error');
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
