import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { dbErrorMessage } from './db.js';
import { validateAndCalculateOrder } from './order-validator.js';
import { autoProcessOrderShipping } from './shiprocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for local dev fallback when MySQL is offline
function getBackupOrders() {
  try {
    const backupPath = path.join(__dirname, '..', 'backup', 'orders.json');
    if (fs.existsSync(backupPath)) {
      return JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Backup orders read note:', e.message);
  }
  return [];
}

/**
 * Maps database order row and items into standardized order object
 */
function formatOrderResponse(ord, itemsRows = []) {
  return {
    id: ord.id,
    orderId: ord.orderId,
    customerId: ord.customer_id || null,
    shiprocketOrderId: ord.shiprocket_order_id || null,
    awbCode: ord.awb_code || null,
    courierName: ord.courier_name || null,
    courierId: ord.courier_id || null,
    shippingLabelUrl: ord.shipping_label_url || null,
    date: ord.date,
    status: ord.status,
    paymentStatus: ord.paymentStatus,
    paymentMethod: ord.paymentMethod,
    subtotal: Number(ord.subtotal),
    delivery: Number(ord.delivery),
    total: Number(ord.total),
    returnRequestedAt: ord.returnRequestedAt,
    returnReason: ord.returnReason,
    deliveredAt: ord.deliveredAt,
    statusHistory: typeof ord.statusHistory === 'string'
      ? JSON.parse(ord.statusHistory)
      : (ord.statusHistory || [
          { status: ord.status || 'Order Received', timestamp: ord.created_at || new Date().toISOString() }
        ]),
    customer: {
      name: ord.customer_name,
      phone: ord.customer_phone,
      email: ord.customer_email,
      address: ord.customer_address,
      city: ord.customer_city,
      state: ord.customer_state,
      pincode: ord.customer_pincode,
      notes: ord.customer_notes,
      paymentMethod: ord.paymentMethod
    },
    items: itemsRows.map((item) => ({
      ...item,
      price: Number(item.price || item.priceAtPurchase || 0),
      unitPrice: Number(item.unitPrice || item.priceAtPurchase || 0),
      priceAtPurchase: Number(item.priceAtPurchase || item.price || 0),
      discount: Number(item.discount || 0),
      gstRate: Number(item.gstRate || 18),
      weight: Number(item.weight || 0.5),
      taxableValue: Number(item.taxableValue || 0),
      taxAmount: Number(item.taxAmount || 0),
      subtotal: Number(item.subtotal || 0),
      lineTotal: Number(item.lineTotal || 0),
      quantity: Number(item.quantity || 1)
    }))
  };
}

/**
 * POST /api/orders/track
 * Secure guest order tracking requiring Order ID + Email verification
 */
export async function trackOrderHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const orderId = String(req.body?.orderId || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();

  if (!orderId || !email) {
    return res.status(400).json({
      success: false,
      error: 'Both Order ID and the Email address used at checkout are required to track an order.'
    });
  }

  // 1. Try MySQL database
  try {
    const [ordersRows] = await pool.query(
      `SELECT * FROM orders WHERE (id = ? OR orderId = ?) AND LOWER(customer_email) = ? LIMIT 1`,
      [orderId, orderId, email]
    );

    if (ordersRows.length > 0) {
      const ord = ordersRows[0];
      const [itemsRows] = await pool.query(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [ord.id]
      );
      return res.status(200).json({
        success: true,
        order: formatOrderResponse(ord, itemsRows)
      });
    }
  } catch (err) {
    console.warn('MySQL trackOrder query error, checking fallback:', err.message);
  }

  // 2. Fallback to backup orders if MySQL is offline or unseeded
  const backupOrders = getBackupOrders();
  const matched = backupOrders.find(
    (o) =>
      (String(o.id || o.orderId).toLowerCase() === orderId.toLowerCase()) &&
      (String(o.customer?.email || '').toLowerCase() === email)
  );

  if (matched) {
    return res.status(200).json({
      success: true,
      order: {
        ...matched,
        subtotal: Number(matched.subtotal || 0),
        delivery: Number(matched.delivery || 0),
        total: Number(matched.total || 0),
        statusHistory: matched.statusHistory || [
          { status: matched.status || 'Order Received', timestamp: new Date().toISOString() }
        ]
      }
    });
  }

  // Generic secure failure message (never disclose if Order ID exists under different email)
  return res.status(404).json({
    success: false,
    error: 'No order found matching the provided Order ID and Email address. Please verify your details.'
  });
}

/**
 * GET /api/customer/orders
 * Returns all orders for an authenticated customer
 */
export async function customerOrdersHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const email = String(req.query?.email || '').trim().toLowerCase();
  const customerId = String(req.query?.customerId || '').trim();

  if (!email && !customerId) {
    return res.status(400).json({ success: false, error: 'Customer identifier required' });
  }

  try {
    const [ordersRows] = await pool.query(
      `SELECT * FROM orders
       WHERE (? != '' AND customer_id = ?) OR (? != '' AND LOWER(customer_email) = ?)
       ORDER BY created_at DESC`,
      [customerId, customerId, email, email]
    );

    const orders = await Promise.all(
      ordersRows.map(async (ord) => {
        const [itemsRows] = await pool.query(
          `SELECT * FROM order_items WHERE order_id = ?`,
          [ord.id]
        );
        return formatOrderResponse(ord, itemsRows);
      })
    );

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.warn('MySQL customerOrders query error, checking fallback:', err.message);
  }

  // Fallback to backup orders for dev environment
  const backupOrders = getBackupOrders();
  const customerOrders = backupOrders.filter(
    (o) =>
      (customerId && o.customerId === customerId) ||
      (email && String(o.customer?.email || '').toLowerCase() === email)
  );

  return res.status(200).json({ success: true, orders: customerOrders });
}

/**
 * POST /api/customer/orders/claim
 * Links eligible previous guest orders with the customer's account upon email verification
 */
export async function claimCustomerOrdersHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  const customerId = String(req.body?.customerId || '').trim();

  if (!email || !customerId) {
    return res.status(400).json({ success: false, error: 'Both customerId and email are required to claim orders.' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE orders
       SET customer_id = ?, updated_at = NOW()
       WHERE (customer_id IS NULL OR customer_id = '' OR customer_id = 'guest')
         AND LOWER(customer_email) = ?`,
      [customerId, email]
    );

    return res.status(200).json({
      success: true,
      message: `${result.affectedRows} previous guest order(s) successfully linked to your account.`,
      claimedCount: result.affectedRows
    });
  } catch (err) {
    console.warn('MySQL claim orders note, checking fallback:', err.message);
    const backupOrders = getBackupOrders();
    let updatedCount = 0;
    backupOrders.forEach((o) => {
      if ((!o.customerId || o.customerId === 'guest') && String(o.customer?.email || '').toLowerCase() === email) {
        o.customerId = customerId;
        updatedCount++;
      }
    });

    return res.status(200).json({
      success: true,
      message: `${updatedCount} previous order(s) successfully linked to your account.`,
      claimedCount: updatedCount
    });
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch all orders
  if (req.method === 'GET') {
    try {
      const [ordersRows] = await pool.query(
        `SELECT * FROM orders ORDER BY created_at DESC`
      );

      const orders = await Promise.all(
        ordersRows.map(async (ord) => {
          const [itemsRows] = await pool.query(
            `SELECT * FROM order_items WHERE order_id = ?`,
            [ord.id]
          );

          return {
            id: ord.id,
            orderId: ord.orderId,
            customerId: ord.customer_id || null,
            shiprocketOrderId: ord.shiprocket_order_id || null,
            awbCode: ord.awb_code || null,
            courierName: ord.courier_name || null,
            courierId: ord.courier_id || null,
            shippingLabelUrl: ord.shipping_label_url || null,
            date: ord.date,
            status: ord.status,
            paymentStatus: ord.paymentStatus,
            paymentMethod: ord.paymentMethod,
            subtotal: Number(ord.subtotal),
            delivery: Number(ord.delivery),
            total: Number(ord.total),
            returnRequestedAt: ord.returnRequestedAt,
            returnReason: ord.returnReason,
            deliveredAt: ord.deliveredAt,
            statusHistory: typeof ord.statusHistory === 'string' ? JSON.parse(ord.statusHistory) : (ord.statusHistory || []),
            customer: {
              name: ord.customer_name,
              phone: ord.customer_phone,
              email: ord.customer_email,
              address: ord.customer_address,
              city: ord.customer_city,
              state: ord.customer_state,
              pincode: ord.customer_pincode,
              notes: ord.customer_notes,
              paymentMethod: ord.paymentMethod
            },
            items: itemsRows.map((item) => ({
              ...item,
              price: Number(item.price),
              unitPrice: Number(item.unitPrice),
              priceAtPurchase: Number(item.priceAtPurchase),
              discount: Number(item.discount),
              gstRate: Number(item.gstRate),
              weight: Number(item.weight || 0.5),
              taxableValue: Number(item.taxableValue),
              taxAmount: Number(item.taxAmount),
              subtotal: Number(item.subtotal),
              lineTotal: Number(item.lineTotal),
              quantity: Number(item.quantity)
            }))
          };
        })
      );

      return res.status(200).json({ success: true, orders });
    } catch (err) {
      console.warn('MySQL GET orders note, returning backup orders:', err.message);
      const backupOrders = getBackupOrders();
      return res.status(200).json({ success: true, orders: backupOrders });
    }
  }

  // POST: Create order with ATOMIC TRANSACTION & SECURE TOTAL CALCULATION
  if (req.method === 'POST') {
    const orderData = req.body || {};
    const customer = orderData.customer || {};
    const items = orderData.items || [];
    const customerId = orderData.customerId || customer.uid || null;

    // Validate items and recalculate totals securely on the backend
    const validation = await validateAndCalculateOrder(items);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const verifiedItems = validation.verifiedItems;
    const subtotal = validation.subtotal;
    const delivery = validation.delivery;
    const total = validation.total;

    const generatedOrderId = orderData.orderId || (`GM-` + Math.floor(100000 + Math.random() * 900000));

    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Check if order already exists (idempotency)
        const [existing] = await connection.query(
          `SELECT id FROM orders WHERE id = ? OR orderId = ?`,
          [generatedOrderId, generatedOrderId]
        );
        if (existing.length > 0) {
          await connection.rollback();
          return res.status(200).json({ success: true, orderId: generatedOrderId, message: 'Order already recorded' });
        }

        // Check stock and decrement atomically
        for (const item of verifiedItems) {
          const prodId = item.productId || item.id;
          if (prodId) {
            const [prodRows] = await connection.query(
              `SELECT stock, name FROM products WHERE id = ? OR productId = ? FOR UPDATE`,
              [prodId, prodId]
            );

            if (prodRows.length > 0) {
              const currentStock = Number(prodRows[0].stock);
              const reqQty = Number(item.quantity || 1);
              if (currentStock < reqQty) {
                await connection.rollback();
                return res.status(400).json({
                  success: false,
                  error: `Insufficient stock for ${prodRows[0].name}. Available: ${currentStock}, Required: ${reqQty}`
                });
              }

              const newStock = Math.max(0, currentStock - reqQty);
              await connection.query(
                `UPDATE products SET stock = ?, inStock = ?, updated_at = NOW() WHERE id = ? OR productId = ?`,
                [newStock, newStock > 0, prodId, prodId]
              );
            }
          }
        }

        // Insert order header with customer_id
        await connection.query(
          `INSERT INTO orders (
            id, orderId, customer_id, customer_name, customer_phone, customer_email, customer_address,
            customer_city, customer_state, customer_pincode, customer_notes, paymentMethod,
            paymentStatus, status, subtotal, delivery, total, date, statusHistory
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generatedOrderId,
            generatedOrderId,
            customerId,
            customer.name || 'Customer',
            customer.phone || '',
            customer.email || null,
            customer.address || '',
            customer.city || '',
            customer.state || '',
            customer.pincode || '',
            customer.notes || null,
            customer.paymentMethod || orderData.paymentMethod || 'COD',
            orderData.paymentStatus || 'Pending',
            orderData.status || 'Order Received',
            subtotal,
            delivery,
            total,
            orderData.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            JSON.stringify(orderData.statusHistory || [{ status: orderData.status || 'Order Received', timestamp: new Date().toISOString() }])
          ]
        );

        // Insert order line items with permanent price snapshots
        for (const item of verifiedItems) {
          const unitPrice = Number(item.priceAtPurchase || item.unitPrice || 0);
          const qty = Number(item.quantity || 1);
          const discount = Number(item.discount || 0);
          const gstRate = Number(item.gstRate || 18);
          const lineTotal = Math.max(0, unitPrice * qty - discount);
          const taxAmount = Math.round((lineTotal * gstRate) / (100 + gstRate) * 100) / 100;
          const taxableValue = Math.round((lineTotal - taxAmount) * 100) / 100;

          await connection.query(
            `INSERT INTO order_items (
              order_id, product_id, name, sku, quantity, weight, price, unitPrice,
              priceAtPurchase, discount, gstRate, hsnCode, taxableValue, taxAmount,
              subtotal, lineTotal, image
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generatedOrderId,
              item.productId || item.id || null,
              item.name || 'Product',
              item.sku || null,
              qty,
              Number(item.weight || 0.5),
              unitPrice,
              unitPrice,
              unitPrice,
              discount,
              gstRate,
              item.hsnCode || item.hsn || '2309',
              taxableValue,
              taxAmount,
              unitPrice * qty,
              lineTotal,
              item.image || null
            ]
          );
        }

        await connection.commit();
      } catch (dbErr) {
        await connection.rollback();
        console.error('MySQL transaction error during POST order:', dbErr);
        return res.status(503).json({
          success: false,
          error: 'Order could not be saved. Please retry.'
        });
      } finally {
        connection.release();
      }
    } catch (poolErr) {
      console.error('MySQL pool connection error during POST order:', poolErr);
      return res.status(503).json({
        success: false,
        error: 'Order service temporarily unavailable. Please retry.'
      });
    }

    setImmediate(() => autoProcessOrderShipping(generatedOrderId));

    const createdOrder = {
      ...orderData,
      id: generatedOrderId,
      orderId: generatedOrderId,
      customerId,
      items: verifiedItems,
      subtotal,
      delivery,
      total,
      status: orderData.status || 'Order Received'
    };

    return res.status(200).json({
      success: true,
      orderId: generatedOrderId,
      order: createdOrder
    });
  }

  // PUT: Update order status / return request
  if (req.method === 'PUT') {
    try {
      const { orderId, status, returnReason, returnRequestedAt } = req.body || {};
      if (!orderId) return res.status(400).json({ success: false, error: 'orderId required' });

      if (status === 'Return Requested') {
        await pool.query(
          `UPDATE orders SET status = ?, returnReason = ?, returnRequestedAt = ?, updated_at = NOW() WHERE id = ? OR orderId = ?`,
          [status, returnReason || 'Not specified', returnRequestedAt || new Date().toISOString(), orderId, orderId]
        );
      } else if (status === 'Delivered') {
        await pool.query(
          `UPDATE orders SET status = ?, deliveredAt = NOW(), updated_at = NOW() WHERE id = ? OR orderId = ?`,
          [status, orderId, orderId]
        );
      } else {
        await pool.query(
          `UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ? OR orderId = ?`,
          [status, orderId, orderId]
        );
      }

      return res.status(200).json({ success: true, message: `Order #${orderId} updated to ${status}` });
    } catch (err) {
      console.error('MySQL PUT order error:', err);
      return res.status(500).json({ success: false, error: dbErrorMessage(err) });
    }
  }

  // DELETE: Delete order
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ success: false, error: 'Order ID required' });

      await pool.query(`DELETE FROM orders WHERE id = ? OR orderId = ?`, [id, id]);
      return res.status(200).json({ success: true, message: 'Order deleted' });
    } catch (err) {
      console.error('MySQL DELETE order error:', err);
      return res.status(500).json({ success: false, error: dbErrorMessage(err) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
