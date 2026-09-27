import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { dbErrorMessage } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBackupProducts() {
  try {
    const backupPath = path.join(__dirname, '..', 'backup', 'products.json');
    if (fs.existsSync(backupPath)) {
      return JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Backup products read note:', e.message);
  }
  return [];
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch all active/all products
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM products ORDER BY created_at DESC`
      );

      const products = rows.map((row) => ({
        ...row,
        inStock: Boolean(row.inStock),
        active: Boolean(row.active),
        isBestSeller: Boolean(row.isBestSeller),
        isFeatured: Boolean(row.isFeatured),
        price: Number(row.price),
        oldPrice: row.oldPrice ? Number(row.oldPrice) : null,
        stock: Number(row.stock),
        rating: Number(row.rating),
        reviewsCount: Number(row.reviewsCount),
        gallery: typeof row.gallery === 'string' ? JSON.parse(row.gallery) : (row.gallery || []),
        variants: typeof row.variants === 'string' ? JSON.parse(row.variants) : (row.variants || []),
        details: typeof row.details === 'string' ? JSON.parse(row.details) : (row.details || {})
      }));

      return res.status(200).json({ success: true, products });
    } catch (err) {
      console.warn('MySQL GET products note, returning backup catalog:', err.message);
      const backupProducts = getBackupProducts();
      return res.status(200).json({ success: true, products: backupProducts });
    }
  }

  // POST: Add new product
  if (req.method === 'POST') {
    try {
      const prod = req.body;
      const prodId = prod.id || `prod-${Date.now()}`;

      await pool.query(
        `INSERT INTO products (
          id, productId, sku, name, brand, category, productType, price, oldPrice, weight,
          stock, inStock, active, isBestSeller, isFeatured, rating, reviewsCount,
          hsnCode, gstRate, image, imageUrl, imageFit, gallery, variants, description, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name=VALUES(name), brand=VALUES(brand), category=VALUES(category), price=VALUES(price),
          weight=VALUES(weight), stock=VALUES(stock), inStock=VALUES(inStock), active=VALUES(active),
          variants=VALUES(variants), details=VALUES(details), updated_at=NOW()`,
        [
          prodId,
          prod.productId || prodId,
          prod.sku || null,
          prod.name,
          prod.brand || null,
          prod.category || null,
          prod.productType || null,
          Number(prod.price || 0),
          prod.oldPrice ? Number(prod.oldPrice) : null,
          Number(prod.weight || 0.5),
          Number(prod.stock || 0),
          prod.inStock ?? true,
          prod.active ?? true,
          prod.isBestSeller ?? false,
          prod.isFeatured ?? false,
          Number(prod.rating || 5.0),
          Number(prod.reviewsCount || 0),
          prod.hsnCode || '2309',
          Number(prod.gstRate || 18),
          prod.image || null,
          prod.imageUrl || null,
          prod.imageFit || 'cover',
          prod.gallery ? JSON.stringify(prod.gallery) : null,
          prod.variants ? JSON.stringify(prod.variants) : null,
          prod.description || null,
          prod.details ? JSON.stringify(prod.details) : null
        ]
      );

      return res.status(200).json({ success: true, id: prodId });
    } catch (err) {
      console.error('MySQL POST product error:', err);
      return res.status(500).json({ success: false, error: dbErrorMessage(err) });
    }
  }

  // PUT: Partial update of a single product
  if (req.method === 'PUT') {
    try {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ success: false, error: 'Product ID required' });

      const columnMap = {
        sku: 'sku', name: 'name', brand: 'brand', category: 'category', productType: 'productType',
        price: 'price', oldPrice: 'oldPrice', weight: 'weight', stock: 'stock', inStock: 'inStock', active: 'active',
        isBestSeller: 'isBestSeller', isFeatured: 'isFeatured', rating: 'rating', reviewsCount: 'reviewsCount',
        hsnCode: 'hsnCode', gstRate: 'gstRate', image: 'image', imageUrl: 'imageUrl', imageFit: 'imageFit',
        description: 'description'
      };
      const jsonMap = { gallery: 'gallery', variants: 'variants', details: 'details' };

      const sets = [];
      const values = [];

      for (const [key, column] of Object.entries(columnMap)) {
        if (fields[key] === undefined) continue;
        sets.push(`${column} = ?`);
        values.push(fields[key] === '' ? null : fields[key]);
      }

      for (const [key, column] of Object.entries(jsonMap)) {
        if (fields[key] === undefined) continue;
        sets.push(`${column} = ?`);
        values.push(fields[key] === null ? null : JSON.stringify(fields[key]));
      }

      if (sets.length === 0) {
        return res.status(200).json({ success: true, message: 'No fields to update' });
      }

      values.push(id);
      await pool.query(
        `UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ? OR productId = ?`,
        [...values, id]
      );

      return res.status(200).json({ success: true, id });
    } catch (err) {
      console.error('MySQL PUT product error:', err);
      return res.status(500).json({ success: false, error: dbErrorMessage(err) });
    }
  }

  // DELETE: Remove product
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ success: false, error: 'Product ID required' });

      await pool.query(`DELETE FROM products WHERE id = ?`, [id]);
      return res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (err) {
      console.error('MySQL DELETE product error:', err);
      return res.status(500).json({ success: false, error: dbErrorMessage(err) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
