import crypto from 'crypto';
import pool, { dbErrorMessage } from './db.js';
import { validateAndCalculateOrder } from './order-validator.js';
import sendOrderHandler from './send-order.js';
import { autoProcessOrderShipping } from './shiprocket.js';

export async function createRazorpayOrderHandler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { items, amount: clientAmount, receipt } = req.body || {};
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keyId || !keySecret) {
    return res.status(500).json({
      success: false,
      error: 'Razorpay API credentials not configured on backend server.'
    });
  }

  let finalAmount = 0;
  let orderCalculation = null;

  // Calculate order total securely on the backend if items are supplied
  if (Array.isArray(items) && items.length > 0) {
    const validation = await validateAndCalculateOrder(items);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    finalAmount = validation.total;
    orderCalculation = validation;
  } else if (clientAmount && Number(clientAmount) > 0) {
    // Fallback for simple tests
    finalAmount = Number(clientAmount);
  } else {
    return res.status(400).json({ success: false, error: 'Invalid items or order amount' });
  }

  try {
    // Convert amount to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(finalAmount * 100);
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        payment_capture: 1
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Razorpay API error response:', data);
      return res.status(response.status).json({
        success: false,
        error: data.error?.description || 'Failed to create Razorpay order'
      });
    }

    return res.status(200).json({
      success: true,
      razorpayOrderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId: keyId,
      calculatedTotal: finalAmount,
      calculation: orderCalculation
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return res.status(500).json({ success: false, error: dbErrorMessage(err) });
  }
}

export async function verifyRazorpayPaymentHandler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderData
  } = req.body || {};

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keySecret) {
    return res.status(500).json({
      success: false,
      error: 'Razorpay secret key not configured on backend server.'
    });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderData) {
    return res.status(400).json({
      success: false,
      error: 'Missing Razorpay verification parameters or order payload'
    });
  }

  try {
    // 1. Verify HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const receivedBuf = Buffer.from(String(razorpay_signature), 'utf-8');
    const isSignatureValid =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isSignatureValid) {
      console.warn(`Razorpay signature mismatch for order ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed: Invalid signature'
      });
    }

    // 2. Signature valid — recalculate verified items & totals securely
    let verifiedCalculation = null;
    if (Array.isArray(orderData.items) && orderData.items.length > 0) {
      verifiedCalculation = await validateAndCalculateOrder(orderData.items);
    }

    const customer = orderData.customer || {};
    const customerId = orderData.customerId || customer.uid || null;
    const finalItems = verifiedCalculation?.verifiedItems || orderData.items || [];
    const finalSubtotal = verifiedCalculation ? verifiedCalculation.subtotal : Number(orderData.subtotal || 0);
    const finalDelivery = verifiedCalculation ? verifiedCalculation.delivery : Number(orderData.delivery || 0);
    const finalTotal = verifiedCalculation ? verifiedCalculation.total : Number(orderData.total || 0);

    const finalOrder = {
      ...orderData,
      customerId: customerId,
      items: finalItems,
      subtotal: finalSubtotal,
      delivery: finalDelivery,
      total: finalTotal,
      paymentMethod: 'Razorpay (Cards/UPI/NetBanking)',
      paymentStatus: 'Paid',
      status: 'Confirmed',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      updatedAt: new Date().toISOString()
    };

    // 3. Save order to database via transaction
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Check if order already saved (idempotency check)
        const [existing] = await connection.query(
          `SELECT id FROM orders WHERE id = ? OR orderId = ?`,
          [finalOrder.id || finalOrder.orderId, finalOrder.orderId]
        );

        if (existing.length === 0) {
          // Insert order header
          await connection.query(
            `INSERT INTO orders (
              id, orderId, customer_id, customer_name, customer_phone, customer_email, customer_address,
              customer_city, customer_state, customer_pincode, customer_notes, paymentMethod,
              paymentStatus, status, subtotal, delivery, total, date, statusHistory
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              finalOrder.id || finalOrder.orderId,
              finalOrder.orderId,
              customerId,
              customer.name || 'Customer',
              customer.phone || '',
              customer.email || null,
              customer.address || '',
              customer.city || '',
              customer.state || '',
              customer.pincode || '',
              customer.notes || null,
              finalOrder.paymentMethod,
              finalOrder.paymentStatus,
              finalOrder.status,
              finalSubtotal,
              finalDelivery,
              finalTotal,
              finalOrder.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              JSON.stringify([
                { status: 'Confirmed', timestamp: new Date().toISOString(), note: `Paid via Razorpay (${razorpay_payment_id})` }
              ])
            ]
          );

          // Insert order line items & update product stock
          if (Array.isArray(finalItems)) {
            for (const item of finalItems) {
              const unitPrice = Number(item.priceAtPurchase || item.price || item.unitPrice || 0);
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
                  finalOrder.id || finalOrder.orderId,
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

              // Decrement stock safely
              const prodId = item.productId || item.id;
              if (prodId) {
                // MySQL evaluates SET assignments left-to-right, so `stock`
                // here already holds the post-decrement value.
                await connection.query(
                  `UPDATE products SET stock = GREATEST(0, stock - ?), inStock = (stock > 0), updated_at = NOW() WHERE id = ? OR productId = ?`,
                  [qty, prodId, prodId]
                );
              }
            }
          }
        }

        await connection.commit();
      } catch (dbErr) {
        await connection.rollback();
        console.error('MySQL transaction error during payment verification:', dbErr);
        // Payment is already captured by Razorpay. Do not report success:
        // the client must retry so the order is not lost.
        return res.status(503).json({
          success: false,
          error: 'Payment captured but order could not be saved. Please contact support with your payment ID.',
          razorpayPaymentId: razorpay_payment_id
        });
      } finally {
        connection.release();
      }
    } catch (poolErr) {
      console.error('MySQL pool connection error during payment verification:', poolErr);
      return res.status(503).json({
        success: false,
        error: 'Payment captured but order service unavailable. Please contact support with your payment ID.',
        razorpayPaymentId: razorpay_payment_id
      });
    }

    setImmediate(() => autoProcessOrderShipping(finalOrder.orderId));

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order saved successfully',
      order: finalOrder
    });
  } catch (err) {
    console.error('Error verifying Razorpay payment:', err);
    return res.status(500).json({ success: false, error: dbErrorMessage(err) });
  }
}
