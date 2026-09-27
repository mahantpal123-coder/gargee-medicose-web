import nodemailer from 'nodemailer';

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Status update notification handler
  if (req.body?.type === 'status_update') {
    const { orderId, customerEmail, customerName, newStatus } = req.body;
    if (!orderId || !customerEmail || !newStatus) {
      return res.status(400).json({ error: 'Missing required status update fields' });
    }

    const origin = process.env.FRONTEND_ORIGIN || 'https://gargeemedicose.com';
    const trackUrl = `${origin}/?page=track&orderId=${orderId}&email=${encodeURIComponent(customerEmail)}`;

    const statusHtml = `
    <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #0284c7; margin-top: 0;">🐾 Gargee Medicose Order Update</h2>
      <p>Hello ${escapeHtml(customerName || 'Customer')},</p>
      <p>Your order <strong>#${orderId}</strong> has been updated to:</p>
      <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 12px 16px; border-radius: 8px; font-weight: bold; color: #166534; font-size: 16px; margin: 16px 0;">
        ${escapeHtml(newStatus)}
      </div>
      <p>You can track the progress of your delivery in real-time below:</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${trackUrl}" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: bold; display: inline-block;">
          Track Order Status
        </a>
      </p>
      <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
        Questions? Contact us on WhatsApp: +91 99936 17796
      </p>
    </div>
    `;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: (process.env.SMTP_PORT || '465') === '465',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({
          from: `"Gargee Medicose" <${process.env.SMTP_USER}>`,
          to: customerEmail,
          subject: `📦 Order #${orderId} Status Update: ${newStatus}`,
          html: statusHtml
        });
        return res.status(200).json({ success: true, message: 'Status email sent' });
      } catch (err) {
        console.warn('Status update email error:', err.message);
      }
    }
    return res.status(200).json({ success: true, message: 'Status notification recorded' });
  }

  const ownerEmail = process.env.OWNER_EMAIL || 'spjgrowth@gmail.com';

  const { order, website_hp } = req.body || {};

  // Honeypot check for bot detection
  if (website_hp) {
    return res.status(200).json({ success: true, message: 'Order created' });
  }

  if (!order || !order.orderId || !order.customer) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  const { orderId, date, customer, items, subtotal, delivery, total } = order;
  const safeName = escapeHtml(customer.name);
  const safeAddress = escapeHtml(customer.address);
  const safeCity = escapeHtml(customer.city || '');
  const safeState = escapeHtml(customer.state || '');
  const safePincode = escapeHtml(customer.pincode || '');
  const safePhone = escapeHtml(customer.phone);
  const safeEmail = escapeHtml(customer.email || 'Not provided');
  const safeNotes = escapeHtml(customer.notes || 'None');

  const origin = process.env.FRONTEND_ORIGIN || 'https://gargeemedicose.com';
  const trackUrl = `${origin}/?page=track&orderId=${orderId}&email=${encodeURIComponent(customer.email || '')}`;

  const itemsRows = (items || [])
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 8px; font-weight: bold; color: #1e293b;">${idx + 1}. ${escapeHtml(item.name)}</td>
        <td style="padding: 10px 8px; text-align: center; color: #64748b;">${escapeHtml(item.brand || 'Gargee')}</td>
        <td style="padding: 10px 8px; text-align: center; font-weight: 600; color: #0f172a;">${Number(item.quantity) || 1}</td>
        <td style="padding: 10px 8px; text-align: right; color: #0f172a;">₹${Number(item.price) || 0}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #0284c7;">₹${(Number(item.quantity) || 1) * (Number(item.price) || 0)}</td>
      </tr>
    `
    )
    .join('');

  const customerHtmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Order Confirmation #${orderId}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">

      <div style="background: linear-gradient(135deg, #0284c7, #0369a1); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">🐾 GARGEE MEDICOSE</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Order Confirmation & Receipt</p>
      </div>

      <div style="padding: 24px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 16px; color: #166534; font-weight: 800;">Thank You, ${safeName}!</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #15803d;">Your order <strong>#${orderId}</strong> has been received and confirmed.</p>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${trackUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.3);">
            Track Your Order Status
          </a>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase;">Delivery Details</h3>
          <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
            <strong>${safeName}</strong><br>
            ${safeAddress}<br>
            ${safeCity}, ${safeState} - ${safePincode}<br>
            Phone: +91 ${safePhone}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left; color: #475569;">
                <th style="padding: 8px;">Product</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Unit Price</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Subtotal:</span>
            <strong>₹${subtotal}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Delivery:</span>
            <strong>${delivery === 0 ? 'FREE' : `₹${delivery}`}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 15px; color: #0284c7;">
            <span>Total:</span>
            <strong>₹${total}</strong>
          </div>
          <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">
            Payment Method: <strong>${escapeHtml(order.paymentMethod || 'COD')}</strong> • Status: <strong>${escapeHtml(order.paymentStatus || 'Paid')}</strong>
          </p>
        </div>
      </div>

      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        Gargee Medicose • Need help? WhatsApp us at +91 99936 17796
      </div>
    </div>
  </body>
  </html>
  `;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>New Order #${orderId}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0284c7, #0369a1); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">🐾 GARGEE MEDICOSE</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">New Customer Order Notification</p>
      </div>

      <div style="padding: 24px;">

        <!-- Status Banner -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; font-weight: 800; color: #166534;">Order #${orderId}</span>
            <span style="font-size: 12px; font-weight: 700; background: #22c55e; color: #ffffff; padding: 2px 10px; border-radius: 20px; text-transform: uppercase;">
              ${(customer.paymentMethod || 'COD').toUpperCase()}
            </span>
          </div>
          <p style="margin: 4px 0 0; font-size: 12px; color: #15803d;">Date: ${date}</p>
        </div>

        <!-- Customer & Delivery Information -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Customer & Delivery Details</h3>
          <table style="width: 100%; font-size: 13px; color: #334155; line-height: 1.6;">
            <tr>
              <td style="width: 35%; font-weight: 600; color: #64748b;">Customer Name:</td>
              <td style="font-weight: 700; color: #0f172a;">${safeName}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #64748b;">Phone Number:</td>
              <td style="font-weight: 700; color: #0284c7;">
                <a href="tel:+91${safePhone}" style="color: #0284c7; text-decoration: none;">+91 ${safePhone}</a>
                &nbsp;|&nbsp;
                <a href="https://wa.me/91${safePhone.replace(/\D/g, '')}" style="color: #16a34a; font-weight: bold; text-decoration: none;" target="_blank">WhatsApp Chat</a>
              </td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #64748b;">Email Address:</td>
              <td>${safeEmail}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #64748b; vertical-align: top;">Delivery Address:</td>
              <td style="font-weight: 600; color: #1e293b;">
                ${safeAddress}<br>
                ${safeCity}, ${safeState} - ${safePincode}
              </td>
            </tr>
            ${
              customer.notes
                ? `<tr>
              <td style="font-weight: 600; color: #64748b;">Special Notes:</td>
              <td style="color: #d97706; font-weight: 600;">${safeNotes}</td>
            </tr>`
                : ''
            }
          </table>
        </div>

        <!-- Ordered Items Table -->
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Ordered Items (${(items || []).length})</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left; color: #475569; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 8px;">Product</th>
                <th style="padding: 8px; text-align: center;">Brand</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Unit Price</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <!-- Order Totals -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
          <table style="width: 100%; font-size: 13px;">
            <tr>
              <td style="color: #64748b;">Subtotal:</td>
              <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${subtotal}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Delivery Charges:</td>
              <td style="text-align: right; font-weight: 600; color: #16a34a;">${delivery === 0 ? 'FREE' : `₹${delivery}`}</td>
            </tr>
            <tr style="border-top: 1px solid #cbd5e1;">
              <td style="padding-top: 10px; font-size: 16px; font-weight: 800; color: #0f172a;">Total Order Amount:</td>
              <td style="padding-top: 10px; text-align: right; font-size: 18px; font-weight: 800; color: #0284c7;">₹${total}</td>
            </tr>
          </table>
        </div>

        <!-- Actions -->
        <div style="margin-top: 24px; text-align: center;">
          <a href="https://wa.me/91${safePhone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(safeName)}%2C%20thank%20you%20for%20your%20order%20%23${orderId}%20at%20Gargee%20Medicose%20for%20Rs%20${total}."
             style="display: inline-block; background: #22c55e; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 30px; font-size: 13px;"
             target="_blank">
            💬 Message Customer on WhatsApp
          </a>
        </div>

      </div>

      <!-- Footer -->
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        Gargee Medicose Store System • Gargee Medicose
      </div>
    </div>
  </body>
  </html>
  `;

  let emailSent = false;
  const errors = [];

  // Method 1: Nodemailer with SMTP / Gmail App Password if configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: (process.env.SMTP_PORT || '465') === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"Gargee Medicose Orders" <${process.env.SMTP_USER}>`,
        to: ownerEmail,
        replyTo: customer.email || process.env.SMTP_USER,
        subject: `🐾 New Order #${orderId} - ₹${total} by ${customer.name}`,
        html: htmlContent
      });

      // Also send order receipt & tracking link to customer
      if (customer.email && customer.email.includes('@')) {
        await transporter.sendMail({
          from: `"Gargee Medicose" <${process.env.SMTP_USER}>`,
          to: customer.email,
          subject: `🐾 Order Confirmed #${orderId} - Gargee Medicose`,
          html: customerHtmlContent
        }).catch((cErr) => console.warn('Customer order email note:', cErr.message));
      }

      emailSent = true;
    } catch (err) {
      errors.push({ method: 'nodemailer', error: err.message });
    }
  }

  // Method 2: Resend API if RESEND_API_KEY is available
  if (!emailSent && process.env.RESEND_API_KEY) {
    try {
      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Gargee Medicose <onboarding@resend.dev>',
          to: [ownerEmail],
          subject: `🐾 New Order #${orderId} - ₹${total} by ${customer.name}`,
          html: htmlContent
        })
      });
      if (resendResp.ok) {
        emailSent = true;
      } else {
        const errorData = await resendResp.text();
        errors.push({ method: 'resend', error: errorData });
      }
    } catch (err) {
      errors.push({ method: 'resend', error: err.message });
    }
  }

  // Method 3: Automated WhatsApp Gateway to owner phone (+91 99936 17796)
  let whatsappSent = false;
  const whatsappTarget = process.env.WHATSAPP_OWNER_PHONE || '+919993617796';
  const callMeBotKey = process.env.CALLMEBOT_API_KEY;

  if (callMeBotKey) {
    try {
      const waText = `🐾 *NEW ORDER #${orderId}*\nCustomer: ${customer.name} (${customer.phone})\nTotal: Rs ${total}\nAddress: ${customer.address}, ${customer.city}\nItems: ${(items || []).map(i => `${i.name} x${i.quantity}`).join(', ')}`;
      const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(whatsappTarget)}&text=${encodeURIComponent(waText)}&apikey=${callMeBotKey}`;
      await fetch(waUrl);
      whatsappSent = true;
    } catch (waErr) {
      console.warn("WhatsApp gateway error:", waErr);
    }
  }

  return res.status(200).json({
    success: true,
    emailSent,
    whatsappSent,
    orderId,
    errors: errors.length > 0 ? errors : undefined
  });
}
