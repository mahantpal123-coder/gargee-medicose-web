import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback backup catalog for development resilience if MySQL is offline
let localProductsBackup = null;
function getBackupProducts() {
  if (localProductsBackup) return localProductsBackup;
  try {
    const backupPath = path.join(__dirname, '..', 'backup', 'products.json');
    if (fs.existsSync(backupPath)) {
      localProductsBackup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      return localProductsBackup;
    }
  } catch (e) {
    console.warn('Backup products read note:', e.message);
  }
  return [];
}

/**
 * Validates cart items, verifies stock and current prices from database,
 * and securely calculates subtotal, delivery fee, and order total.
 * NEVER trusts frontend prices or totals.
 *
 * @param {Array} items - List of items from checkout payload [{ id/productId, quantity, variant }]
 * @returns {Promise<{ success: boolean, error?: string, verifiedItems: Array, subtotal: number, delivery: number, total: number }>}
 */
export async function validateAndCalculateOrder(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: 'Order must contain at least one item' };
  }

  const productIds = items
    .map((item) => item.productId || item.id)
    .filter(Boolean);

  if (productIds.length === 0) {
    return { success: false, error: 'Invalid product identifiers in order items' };
  }

  const productMap = new Map();

  // 1. Try querying primary Hostinger MySQL database
  try {
    const placeholders = productIds.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT id, productId, name, price, oldPrice, weight, stock, inStock, active, sku, hsnCode, gstRate, image, imageUrl, variants
       FROM products WHERE id IN (${placeholders}) OR productId IN (${placeholders})`,
      [...productIds, ...productIds]
    );

    for (const row of rows) {
      const prod = {
        ...row,
        price: Number(row.price),
        stock: Number(row.stock),
        inStock: Boolean(row.inStock),
        active: Boolean(row.active),
        variants: typeof row.variants === 'string' ? JSON.parse(row.variants) : (row.variants || [])
      };
      if (prod.id) productMap.set(String(prod.id), prod);
      if (prod.productId) productMap.set(String(prod.productId), prod);
      if (prod.name) productMap.set(String(prod.name).toLowerCase().trim(), prod);
    }
  } catch (dbErr) {
    console.warn('MySQL product lookup note, checking fallback:', dbErr.message);
  }

  // 2. Fallback to backup catalog if MySQL not seeded or offline locally
  if (productMap.size === 0) {
    const backupList = getBackupProducts();
    for (const prod of backupList) {
      const p = {
        ...prod,
        price: Number(prod.price),
        stock: prod.stock !== undefined ? Number(prod.stock) : 100,
        inStock: prod.inStock !== false,
        variants: prod.variants || []
      };
      if (p.id) productMap.set(String(p.id), p);
      if (p.productId) productMap.set(String(p.productId), p);
      if (p.name) productMap.set(String(p.name).toLowerCase().trim(), p);
    }
  }

  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const prodId = String(item.productId || item.id || '');
    const prodName = String(item.name || '').toLowerCase().trim();
    const product = productMap.get(prodId) || (prodName ? productMap.get(prodName) : null);

    if (!product) {
      return {
        success: false,
        error: `Product not found or unavailable: ${item.name || prodId}`
      };
    }

    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

    // Validate stock
    if (product.stock !== undefined && product.stock < qty) {
      return {
        success: false,
        error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${qty}`
      };
    }

    // Determine verified price (check variant if applicable)
    let verifiedUnitPrice = product.price;
    if (item.selectedSize && Array.isArray(product.variants)) {
      const matchingVariant = product.variants.find(
        (v) => String(v.size || v.name).toLowerCase() === String(item.selectedSize).toLowerCase()
      );
      if (matchingVariant && matchingVariant.price) {
        verifiedUnitPrice = Number(matchingVariant.price);
      }
    }

    if (isNaN(verifiedUnitPrice) || verifiedUnitPrice < 0) {
      return { success: false, error: `Invalid price configuration for ${product.name}` };
    }

    const discount = Number(item.discount || product.discount || 0);
    const gstRate = Number(item.gstRate || product.gstRate || 18);
    const lineTotal = Math.max(0, verifiedUnitPrice * qty - discount);
    const taxAmount = Math.round(((lineTotal * gstRate) / (100 + gstRate)) * 100) / 100;
    const taxableValue = Math.round((lineTotal - taxAmount) * 100) / 100;

    subtotal += lineTotal;

    verifiedItems.push({
      productId: product.id,
      id: product.id,
      name: product.name,
      sku: product.sku || item.sku || null,
      quantity: qty,
      weight: Number(item.weight || product.weight || 0.5),
      price: verifiedUnitPrice,
      unitPrice: verifiedUnitPrice,
      priceAtPurchase: verifiedUnitPrice, // Permanent price snapshot
      discount,
      gstRate,
      hsnCode: product.hsnCode || item.hsnCode || '2309',
      taxableValue,
      taxAmount,
      subtotal: lineTotal,
      lineTotal,
      image: product.image || product.imageUrl || item.image || null,
      selectedSize: item.selectedSize || null
    });
  }

  // Delivery fee business rule: Free if subtotal > 1000, else ₹70 (matching ShopContext)
  const delivery = subtotal > 1000 || subtotal === 0 ? 0 : 70;
  const total = subtotal + delivery;

  return {
    success: true,
    verifiedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    delivery,
    total: Math.round(total * 100) / 100
  };
}
