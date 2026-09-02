import nodemailer from 'nodemailer';

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

  const { order } = req.body || {};

  if (!order || !order.orderId || !order.customer) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  const { orderId, date, customer, items, subtotal, delivery, total } = order;
  const ownerEmail = process.env.OWNER_EMAIL || 'spjgrowth@gmail.com';

  const itemsRows = (items || [])
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 8px; font-weight: bold; color: #1e293b;">${idx + 1}. ${item.name}</td>
        <td style="padding: 10px 8px; text-align: center; color: #64748b;">${item.brand || 'Gargee'}</td>
        <td style="padding: 10px 8px; text-align: center; font-weight: 600; color: #0f172a;">${item.quantity}</td>
        <td style="padding: 10px 8px; text-align: right; color: #0f172a;">₹${item.price}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #0284c7;">₹${item.quantity * item.price}</td>
      </tr>
    `
    )
    .join('');

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
              <td style="font-weight: 700; color: #0f172a;">${customer.name}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #64748b;">Phone Number:</td>
              <td style="font-weight: 700; color: #0284c7;">
                <a href="tel:+91${customer.phone}" style="color: #0284c7; text-decoration: none;">+91 ${customer.phone}</a>
                &nbsp;|&nbsp;
                <a href="https://wa.me/91${customer.phone.replace(/\D/g, '')}" style="color: #16a34a; font-weight: bold; text-decoration: none;" target="_blank">WhatsApp Chat</a>
              </td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #64748b;">Email Address:</td>
              <td>${customer.email || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #64748b; vertical-align: top;">Delivery Address:</td>
              <td style="font-weight: 600; color: #1e293b;">
                ${customer.address}<br>
                ${customer.city || 'Bilaspur'}, ${customer.state || 'Chhattisgarh'} - ${customer.pincode || '495001'}
              </td>
            </tr>
            ${
              customer.notes
                ? `<tr>
              <td style="font-weight: 600; color: #64748b;">Special Notes:</td>
              <td style="color: #d97706; font-weight: 600;">${customer.notes}</td>
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
          <a href="https://wa.me/91${customer.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(customer.name)}%2C%20thank%20you%20for%20your%20order%20%23${orderId}%20at%20Gargee%20Medicose%20for%20Rs%20${total}."
             style="display: inline-block; background: #22c55e; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 30px; font-size: 13px;"
             target="_blank">
            💬 Message Customer on WhatsApp
          </a>
        </div>

      </div>

      <!-- Footer -->
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        Gargee Medicose Store System • Bilaspur, Chhattisgarh
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

  // Method 3: FormSubmit HTTP API fallback
  if (!emailSent) {
    try {
      const emailTargets = ['mahantpal123@gmail.com', 'spjgrowth@gmail.com'];
      for (const emailTarget of emailTargets) {
        try {
          await fetch(`https://formsubmit.co/ajax/${emailTarget}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Origin: 'https://gargee-medicose.vercel.app'
            },
            body: JSON.stringify({
              _subject: `🐾 New Order #${orderId} from ${customer.name} (₹${total})`,
              _template: 'table',
              _captcha: 'false',
              'Order ID': orderId,
              'Order Date': date,
              'Customer Name': customer.name,
              'Customer Phone': customer.phone,
              'Customer Email': customer.email || 'Not provided',
              'Delivery Address': `${customer.address}, ${customer.city || 'Bilaspur'}, ${customer.state || 'Chhattisgarh'} - ${customer.pincode || '495001'}`,
              'Payment Method': (customer.paymentMethod || 'UPI ONLINE').toUpperCase(),
              'Order Items': (items || []).map((i) => `${i.name} (Qty: ${i.quantity}) - ₹${i.price * i.quantity}`).join(' | '),
              'Subtotal Amount': `₹${subtotal}`,
              'Delivery Fee': `₹${delivery}`,
              'Total Order Amount': `₹${total}`,
              'Customer Notes': customer.notes || 'None'
            })
          });
          emailSent = true;
        } catch (e) {
          console.warn(`FormSubmit to ${emailTarget} failed:`, e);
        }
      }
    } catch (err) {
      errors.push({ method: 'formsubmit', error: err.message });
    }
  }

  // Method 4: Automated WhatsApp Gateway to owner phone (+91 99936 17796)
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
