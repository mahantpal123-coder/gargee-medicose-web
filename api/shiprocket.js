import pool from './db.js';

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

// In-memory token cache (tokens last ~10 days)
let cachedToken = null;
let tokenExpiry = 0;

async function getShiprocketToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.');
  }

  const resp = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await resp.json();
  if (!resp.ok || !data.token) {
    throw new Error(data.message || data.error || 'Shiprocket authentication failed');
  }

  cachedToken = data.token;
  // Refresh 1 hour before expiry
  tokenExpiry = Date.now() + ((data.expires_in || 864000) - 3600) * 1000;
  return cachedToken;
}

async function shiprocketFetch(path, options = {}) {
  const token = await getShiprocketToken();
  const resp = await fetch(`${SHIPROCKET_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const data = await resp.json();
  if (!resp.ok) {
    const errMsg = data?.message || data?.error || JSON.stringify(data);
    throw new Error(`Shiprocket API error (${resp.status}): ${errMsg}`);
  }
  return data;
}

// Get business pickup location from Shiprocket
async function getPickupLocation() {
  const data = await shiprocketFetch('/settings/company/pickup');
  const locations = data.data || data.pickup_locations || [];
  const primary = locations.find((l) => l.is_primary === 1 || l.code === (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary'));
  return primary || locations[0] || null;
}

/**
 * POST /api/shiprocket/create-order
 * Creates a shipment on Shiprocket for an existing order
 * Body: { orderId, weight? (kg), dimensions?: {length, width, height} (cm) }
 */
export async function createShipmentHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { orderId, weight = 0.5, dimensions } = req.body || {};
  if (!orderId) return res.status(400).json({ success: false, error: 'orderId required' });

  try {
    // Fetch order from DB
    const [orderRows] = await pool.query(
      `SELECT * FROM orders WHERE id = ? OR orderId = ? LIMIT 1`,
      [orderId, orderId]
    );
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    const ord = orderRows[0];

    if (ord.awb_code) {
      return res.status(400).json({ success: false, error: 'Order already has AWB assigned', awbCode: ord.awb_code, courierName: ord.courier_name });
    }

    // Fetch order items for line items
    const [itemRows] = await pool.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [ord.id]
    );

    // Get pickup location
    const pickup = await getPickupLocation();
    if (!pickup) {
      return res.status(500).json({ success: false, error: 'No pickup location configured in Shiprocket account' });
    }

    const dim = dimensions || { length: 15, width: 15, height: 10 };
    const customerName = ord.customer_name || 'Customer';
    const customerPhone = (ord.customer_phone || '').replace(/\D/g, '');
    const totalAmount = Number(ord.total) || 0;
    const isCOD = (ord.paymentMethod || '').toLowerCase().includes('cod');

    // Build line items
    const lineItems = itemRows.map((item, idx) => ({
      name: item.name || `Item ${idx + 1}`,
      sku: item.sku || `SKU-${idx + 1}`,
      units: Number(item.quantity) || 1,
      selling_price: Number(item.priceAtPurchase || item.price) || 0,
      discount: Number(item.discount) || 0,
      tax: Number(item.gstRate) || 18
    }));

    // Calculate total weight from line items (each item has per-unit weight)
    const totalWeight = itemRows.reduce((sum, item) => {
      const unitWeight = Number(item.weight) || 0.5;
      const qty = Number(item.quantity) || 1;
      return sum + (unitWeight * qty);
    }, 0);

    // Create adhoc order on Shiprocket
    const payload = {
      order_id: ord.orderId,
      order_date: ord.created_at || new Date().toISOString(),
      pickup_location: pickup.code || pickup.location || 'Primary',
      billing_customer_name: customerName,
      billing_last_name: '',
      billing_address: ord.customer_address || '',
      billing_city: ord.customer_city || '',
      billing_state: ord.customer_state || '',
      billing_pincode: ord.customer_pincode || '',
      billing_country: 'India',
      billing_phone: customerPhone,
      billing_email: ord.customer_email || '',
      shipping_is_billing: true,
      order_items: lineItems,
      payment_method: isCOD ? 'COD' : 'Prepaid',
      sub_total: totalAmount,
      length: dim.length || 15,
      breadth: dim.width || 15,
      height: dim.height || 10,
      weight: weight || Math.max(0.5, totalWeight)
    };

    const orderData = await shiprocketFetch('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const shiprocketOrderId = orderData.order_id || orderData.response?.data?.order_id;

    if (!shiprocketOrderId) {
      return res.status(500).json({ success: false, error: 'Shiprocket order creation failed', details: orderData });
    }

    // Try to auto-assign courier
    let awbCode = null;
    let courierName = null;
    let courierId = null;
    let estimatedDays = null;

    try {
      const awbData = await shiprocketFetch('/courier/assign/awb', {
        method: 'POST',
        body: JSON.stringify({
          shipment_id: shiprocketOrderId,
          courier_id: null // Let Shiprocket pick the best courier
        })
      });

      const response = awbData.response?.data || awbData;
      awbCode = response.awb_code || response.awb || null;
      courierName = response.courier_name || response.courier_company_name || null;
      courierId = response.courier_id || response.courier_company_id || null;
      estimatedDays = response.estimated_delivery_days || null;
    } catch (awbErr) {
      // AWB assignment can fail (e.g., pincode not serviceable). Not fatal.
      console.warn('Shiprocket auto AWB assignment note:', awbErr.message);
    }

    // Save to DB
    await pool.query(
      `UPDATE orders SET
        shiprocket_order_id = ?,
        awb_code = ?,
        courier_name = ?,
        courier_id = ?,
        status = CASE WHEN ? IS NOT NULL AND status = 'Confirmed' THEN 'Processing' ELSE status END,
        updated_at = NOW()
      WHERE id = ? OR orderId = ?`,
      [shiprocketOrderId, awbCode, courierName, courierId, awbCode, ord.id, ord.orderId]
    );

    return res.status(200).json({
      success: true,
      shiprocketOrderId,
      awbCode,
      courierName,
      estimatedDays
    });
  } catch (err) {
    console.error('Shiprocket create shipment error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/shiprocket/generate-label
 * Generates shipping label PDF for an order
 * Body: { orderId }
 */
export async function generateLabelHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ success: false, error: 'orderId required' });

  try {
    const [orderRows] = await pool.query(
      `SELECT id, orderId, shiprocket_order_id, awb_code FROM orders WHERE id = ? OR orderId = ? LIMIT 1`,
      [orderId, orderId]
    );
    if (orderRows.length === 0) return res.status(404).json({ success: false, error: 'Order not found' });

    const ord = orderRows[0];
    if (!ord.awb_code) return res.status(400).json({ success: false, error: 'AWB not assigned yet. Ship the order first.' });

    const labelData = await shiprocketFetch('/courier/generate/label', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: [ord.shiprocket_order_id] })
    });

    const labelUrl = labelData.response?.data?.label_url || labelData.label_url || null;

    if (labelUrl) {
      await pool.query(
        `UPDATE orders SET shipping_label_url = ?, updated_at = NOW() WHERE id = ?`,
        [labelUrl, ord.id]
      );
    }

    return res.status(200).json({
      success: true,
      labelUrl,
      awbCode: ord.awb_code
    });
  } catch (err) {
    console.error('Shiprocket label generation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/shiprocket/assign-courier
 * Manually assign a specific courier to an order
 * Body: { orderId, courierId }
 */
export async function assignCourierHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { orderId, courierId } = req.body || {};
  if (!orderId || !courierId) return res.status(400).json({ success: false, error: 'orderId and courierId required' });

  try {
    const [orderRows] = await pool.query(
      `SELECT id, orderId, shiprocket_order_id FROM orders WHERE id = ? OR orderId = ? LIMIT 1`,
      [orderId, orderId]
    );
    if (orderRows.length === 0) return res.status(404).json({ success: false, error: 'Order not found' });

    const ord = orderRows[0];
    if (!ord.shiprocket_order_id) return res.status(400).json({ success: false, error: 'Shiprocket order not created yet' });

    const awbData = await shiprocketFetch('/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: ord.shiprocket_order_id, courier_id: courierId })
    });

    const response = awbData.response?.data || awbData;
    const awbCode = response.awb_code || response.awb || null;
    const courierName = response.courier_name || response.courier_company_name || null;

    if (awbCode) {
      await pool.query(
        `UPDATE orders SET awb_code = ?, courier_name = ?, courier_id = ?, updated_at = NOW() WHERE id = ?`,
        [awbCode, courierName, courierId, ord.id]
      );
    }

    return res.status(200).json({ success: true, awbCode, courierName });
  } catch (err) {
    console.error('Shiprocket assign courier error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/shiprocket/track?orderId=... or ?awb=...
 * Returns live tracking status from Shiprocket
 */
export async function trackShipmentHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const orderId = String(req.query?.orderId || '').trim();
  const awb = String(req.query?.awb || '').trim();

  let awbCode = awb;

  // If no AWB provided, look up from order
  if (!awbCode && orderId) {
    try {
      const [rows] = await pool.query(
        `SELECT awb_code FROM orders WHERE id = ? OR orderId = ? LIMIT 1`,
        [orderId, orderId]
      );
      if (rows.length > 0) awbCode = rows[0].awb_code;
    } catch (e) {
      // fallback
    }
  }

  if (!awbCode) {
    return res.status(400).json({ success: false, error: 'AWB code not found for this order' });
  }

  try {
    const trackData = await shiprocketFetch(`/courier/track/shipment/${awbCode}`, {
      method: 'GET'
    });

    const tracking = trackData.response?.data || trackData.tracking_data || trackData;

    return res.status(200).json({
      success: true,
      awbCode,
      tracking: {
        status: tracking?.status || tracking?.shipment_status || null,
        currentStatus: tracking?.current_status || tracking?.status || null,
        etd: tracking?.etd || tracking?.expected_delivery || null,
        scans: tracking?.scans || tracking?.tracking_data || [],
        shiprocketOrderId: tracking?.shipment_id || null,
        courierName: tracking?.courier_name || null
      }
    });
  } catch (err) {
    // Shiprocket tracking can fail if AWB not yet active - not fatal
    return res.status(200).json({
      success: true,
      awbCode,
      tracking: null,
      note: 'Tracking data not yet available. The shipment may still be processing with the courier.'
    });
  }
}

/**
 * GET /api/shiprocket/serviceability?pincode=...&weight=...
 * Checks if delivery is available to a pincode
 */
export async function checkServiceabilityHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const pincode = String(req.query?.pincode || '').trim();
  const weight = Number(req.query?.weight) || 0.5;

  if (!pincode) return res.status(400).json({ success: false, error: 'pincode required' });

  try {
    const pickup = await getPickupLocation();
    if (!pickup) return res.status(500).json({ success: false, error: 'No pickup location configured' });

    const data = await shiprocketFetch(
      `/courier/serviceability/?pickup_postcode=${pickup.postcode || ''}&delivery_postcode=${pincode}&weight=${weight}&cod=0`,
      { method: 'GET' }
    );

    const available = data?.response?.data?.available_courier_companies || [];
    const couriers = available.map((c) => ({
      courierId: c.courier_company_id,
      name: c.courier_name,
      rate: c.rate || c.freight_charge || 0,
      etd: c.estimated_delivery_days || c.cod_charges || null,
      rating: c.rating || 0
    }));

    return res.status(200).json({ success: true, available: couriers.length > 0, couriers });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// --- Auto-Ship Engine ---

const STORE_CITY = (process.env.STORE_CITY || 'Bilaspur').trim().toLowerCase();
const STORE_PINCODE = (process.env.STORE_PINCODE || '495001').trim();

function isLocalDelivery(city, pincode) {
  const c = String(city || '').trim().toLowerCase();
  const p = String(pincode || '').trim();
  if (c && c === STORE_CITY) return true;
  // Bilaspur district pincodes: 495001 - 495xxx
  if (p && p.startsWith(STORE_PINCODE.slice(0, 3))) return true;
  return false;
}

/**
 * Auto-processes shipping for an order after commit.
 * Runs asynchronously — never blocks the HTTP response.
 */
export async function autoProcessOrderShipping(orderId) {
  try {
    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      console.warn('Auto-ship skipped: Shiprocket credentials not configured');
      return;
    }

    // Fetch order + items
    const [orderRows] = await pool.query(
      `SELECT * FROM orders WHERE id = ? OR orderId = ? LIMIT 1`,
      [orderId, orderId]
    );
    if (orderRows.length === 0) return;

    const ord = orderRows[0];
    if (ord.shiprocket_order_id || ord.awb_code) return;

    const isLocal = isLocalDelivery(ord.customer_city, ord.customer_pincode);

    if (isLocal) {
      await pool.query(
        `UPDATE orders SET
          courier_name = 'Local Instant Delivery',
          status = CASE WHEN status IN ('Confirmed','Order Received') THEN 'Processing' ELSE status END,
          updated_at = NOW()
        WHERE id = ? OR orderId = ?`,
        [ord.id, ord.orderId]
      );
      console.log(`Auto-ship: Order #${ord.orderId} routed for Local Instant Delivery`);
      return;
    }

    // Out-of-city: full Shiprocket flow
    const [itemRows] = await pool.query(`SELECT * FROM order_items WHERE order_id = ?`, [ord.id]);
    if (itemRows.length === 0) {
      console.warn(`Auto-ship: Order #${ord.orderId} has no items, skipping`);
      return;
    }

    const pickup = await getPickupLocation();
    if (!pickup) {
      console.warn(`Auto-ship: No Shiprocket pickup location configured for Order #${ord.orderId}`);
      return;
    }

    const dim = { length: 15, width: 15, height: 10 };
    const customerName = ord.customer_name || 'Customer';
    const customerPhone = (ord.customer_phone || '').replace(/\D/g, '');
    const totalAmount = Number(ord.total) || 0;
    const isCOD = (ord.paymentMethod || '').toLowerCase().includes('cod');

    const lineItems = itemRows.map((item, idx) => ({
      name: item.name || `Item ${idx + 1}`,
      sku: item.sku || `SKU-${idx + 1}`,
      units: Number(item.quantity) || 1,
      selling_price: Number(item.priceAtPurchase || item.price) || 0,
      discount: Number(item.discount) || 0,
      tax: Number(item.gstRate) || 18
    }));

    // Calculate total weight from line items (each item has per-unit weight)
    const totalWeight = itemRows.reduce((sum, item) => {
      const unitWeight = Number(item.weight) || 0.5;
      const qty = Number(item.quantity) || 1;
      return sum + (unitWeight * qty);
    }, 0);

    const payload = {
      order_id: ord.orderId,
      order_date: ord.created_at || new Date().toISOString(),
      pickup_location: pickup.code || pickup.location || 'Primary',
      billing_customer_name: customerName,
      billing_last_name: '',
      billing_address: ord.customer_address || '',
      billing_city: ord.customer_city || '',
      billing_state: ord.customer_state || '',
      billing_pincode: ord.customer_pincode || '',
      billing_country: 'India',
      billing_phone: customerPhone,
      billing_email: ord.customer_email || '',
      shipping_is_billing: true,
      order_items: lineItems,
      payment_method: isCOD ? 'COD' : 'Prepaid',
      sub_total: totalAmount,
      length: dim.length,
      breadth: dim.width,
      height: dim.height,
      weight: Math.max(0.5, totalWeight)
    };

    const orderData = await shiprocketFetch('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const shiprocketOrderId = orderData.order_id || orderData.response?.data?.order_id;
    if (!shiprocketOrderId) {
      console.warn(`Auto-ship: Shiprocket order creation failed for #${ord.orderId}`, orderData);
      return;
    }

    // Auto-assign courier
    let awbCode = null;
    let courierName = null;
    let courierId = null;

    try {
      const awbData = await shiprocketFetch('/courier/assign/awb', {
        method: 'POST',
        body: JSON.stringify({ shipment_id: shiprocketOrderId, courier_id: null })
      });
      const response = awbData.response?.data || awbData;
      awbCode = response.awb_code || response.awb || null;
      courierName = response.courier_name || response.courier_company_name || null;
      courierId = response.courier_id || response.courier_company_id || null;
    } catch (awbErr) {
      console.warn('Auto-ship AWB assignment note:', awbErr.message);
    }

    // Auto-generate label
    let shippingLabelUrl = null;
    if (awbCode) {
      try {
        const labelData = await shiprocketFetch('/courier/generate/label', {
          method: 'POST',
          body: JSON.stringify({ shipment_id: [shiprocketOrderId] })
        });
        shippingLabelUrl = labelData.response?.data?.label_url || labelData.label_url || null;
      } catch (labelErr) {
        console.warn('Auto-ship label generation note:', labelErr.message);
      }
    }

    await pool.query(
      `UPDATE orders SET
        shiprocket_order_id = ?,
        awb_code = ?,
        courier_name = ?,
        courier_id = ?,
        shipping_label_url = ?,
        status = CASE WHEN ? IS NOT NULL AND status IN ('Confirmed','Order Received') THEN 'Processing' ELSE status END,
        updated_at = NOW()
      WHERE id = ? OR orderId = ?`,
      [shiprocketOrderId, awbCode, courierName, courierId, shippingLabelUrl, awbCode, ord.id, ord.orderId]
    );

    console.log(`Auto-ship: Order #${ord.orderId} shipped via ${courierName || 'Shiprocket'} (AWB: ${awbCode || 'pending'})`);
  } catch (err) {
    console.error('Auto-ship error for order:', orderId, err.message);
    try {
      await pool.query(
        `UPDATE orders SET
          status = CASE WHEN status IN ('Confirmed','Order Received') THEN 'Processing' ELSE status END,
          updated_at = NOW()
        WHERE (id = ? OR orderId = ?) AND status NOT IN ('Dispatched','Delivered')`,
        [orderId, orderId]
      );
    } catch (_) {}
  }
}

/**
 * POST /api/shiprocket/webhook
 * Shiprocket sends tracking updates here. Auto-uploads order status.
 * Body: { order_id, awb, current_status, scans, ... }
 */
export async function shiprocketWebhookHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { order_id, awb, current_status, status } = req.body || {};
    const trackingStatus = (current_status || status || '').toLowerCase().trim();

    if (!order_id && !awb) {
      return res.status(400).json({ success: false, error: 'Missing order_id or awb' });
    }

    // Find order by orderId or AWB
    let orderRows;
    if (awb) {
      [orderRows] = await pool.query(
        `SELECT * FROM orders WHERE awb_code = ? LIMIT 1`, [awb]
      );
    } else {
      [orderRows] = await pool.query(
        `SELECT * FROM orders WHERE id = ? OR orderId = ? LIMIT 1`, [order_id, order_id]
      );
    }

    if (!orderRows || orderRows.length === 0) {
      console.warn('Shiprocket webhook: order not found for', order_id || awb);
      return res.status(200).json({ success: true, message: 'Order not found, skipped' });
    }

    const ord = orderRows[0];

    // Map Shiprocket status to our status
    let newStatus = null;
    if (trackingStatus.includes('delivered')) {
      newStatus = 'Delivered';
    } else if (trackingStatus.includes('dispatch') || trackingStatus.includes('pickup') || trackingStatus.includes('rto')) {
      newStatus = 'Dispatched';
    } else if (trackingStatus.includes('transit') || trackingStatus.includes('in transit') || trackingStatus.includes('out for delivery')) {
      newStatus = 'Dispatched';
    }

    if (!newStatus) {
      return res.status(200).json({ success: true, message: 'Status not actionable', trackingStatus });
    }

    // Don't downgrade status (e.g. don't set Dispatched if already Delivered)
    const statusOrder = ['Order Received', 'Confirmed', 'Processing', 'Dispatched', 'Delivered'];
    const currentIdx = statusOrder.indexOf(ord.status);
    const newIdx = statusOrder.indexOf(newStatus);
    if (newIdx <= currentIdx) {
      return res.status(200).json({ success: true, message: 'Status already ahead', currentStatus: ord.status });
    }

    // Update order status
    const updateFields = { status: newStatus, updated_at: new Date() };
    if (newStatus === 'Delivered') {
      await pool.query(
        `UPDATE orders SET status = ?, deliveredAt = NOW(), updated_at = NOW() WHERE id = ? OR orderId = ?`,
        [newStatus, ord.id, ord.orderId]
      );
    } else {
      await pool.query(
        `UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ? OR orderId = ?`,
        [newStatus, ord.id, ord.orderId]
      );
    }

    // Append to statusHistory
    try {
      let history = [];
      if (ord.statusHistory) {
        history = typeof ord.statusHistory === 'string' ? JSON.parse(ord.statusHistory) : ord.statusHistory;
      }
      history.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: `Auto-updated by Shiprocket: ${trackingStatus}`
      });
      await pool.query(
        `UPDATE orders SET statusHistory = ? WHERE id = ?`,
        [JSON.stringify(history), ord.id]
      );
    } catch (_) {}

    // Send customer email notification
    if (ord.customer_email && newStatus) {
      try {
        const fetchModule = await import('node-fetch');
        const fetch = fetchModule.default;
        const origin = process.env.FRONTEND_ORIGIN || 'https://gargeemedicose.com';
        await fetch(`${origin}/api/send-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'status_update',
            orderId: ord.orderId,
            customerEmail: ord.customer_email,
            customerName: ord.customer_name,
            newStatus
          })
        });
      } catch (_) {}
    }

    console.log(`Shiprocket webhook: Order #${ord.orderId} auto-updated to ${newStatus}`);
    return res.status(200).json({ success: true, message: `Order updated to ${newStatus}` });
  } catch (err) {
    console.error('Shiprocket webhook error:', err.message);
    return res.status(200).json({ success: true, message: 'Webhook received' });
  }
}
