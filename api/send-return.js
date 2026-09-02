import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, customer, items, total, reason, returnRequestedAt } = req.body || {};

  if (!orderId || !customer) {
    return res.status(400).json({ error: 'Missing required return details' });
  }

  const ownerEmail = process.env.OWNER_EMAIL || 'spjgrowth@gmail.com';
  const customerName = customer.name || 'Customer';
  const customerPhone = customer.phone || '';
  const customerEmail = customer.email || 'Not provided';
  const returnDate = returnRequestedAt
    ? new Date(returnRequestedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const itemsList = (items || [])
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 8px; font-weight: bold; color: #1e293b;">${idx + 1}. ${item.name}</td>
        <td style="padding: 10px 8px; text-align: center; font-weight: 600;">${item.quantity}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #0284c7;">₹${item.price * item.quantity}</td>
      </tr>`
    )
    .join('');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>Return Request #${orderId}</title></head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">

      <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🔄 RETURN REQUEST</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Gargee Medicose - 2 Day Return Policy</p>
      </div>

      <div style="padding: 24px;">

        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
          <span style="font-size: 14px; font-weight: 800; color: #581c87;">Order #${orderId}</span>
          <p style="margin: 4px 0 0; font-size: 12px; color: #7c3aed;">Return requested on: ${returnDate}</p>
        </div>

        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #9a3412;">Return Reason</h3>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">${reason || 'No reason provided'}</p>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Customer Details</h3>
          <table style="width: 100%; font-size: 13px; color: #334155; line-height: 1.6;">
            <tr>
              <td style="width: 35%; font-weight: 600; color: #64748b;">Name:</td>
              <td style="font-weight: 700; color: #0f172a;">${customerName}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #64748b;">Phone:</td>
              <td style="font-weight: 700; color: #0284c7;">
                <a href="tel:+91${customerPhone}" style="color: #0284c7; text-decoration: none;">+91 ${customerPhone}</a>
                &nbsp;|&nbsp;
                <a href="https://wa.me/91${customerPhone.replace(/\D/g, '')}" style="color: #16a34a; font-weight: bold; text-decoration: none;" target="_blank">WhatsApp</a>
              </td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #64748b;">Email:</td>
              <td>${customerEmail}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #64748b;">Address:</td>
              <td>${customer.address || ''}, ${customer.city || 'Bilaspur'}, ${customer.state || 'CG'} - ${customer.pincode || ''}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left; color: #475569; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 8px;">Product</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsList}</tbody>
          </table>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; text-align: right;">
          <span style="font-size: 16px; font-weight: 800; color: #0f172a;">Order Total: ₹${total}</span>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="https://wa.me/91${customerPhone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(customerName)}%2C%20regarding%20your%20return%20request%20for%20order%20%23${orderId}%20at%20Gargee%20Medicose."
             style="display: inline-block; background: #22c55e; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 30px; font-size: 13px;"
             target="_blank">
            💬 Contact Customer on WhatsApp
          </a>
        </div>

      </div>

      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        Gargee Medicose Store System • Bilaspur, Chhattisgarh
      </div>
    </div>
  </body>
  </html>
  `;

  let emailSent = false;
  const errors = [];
  const subject = `🔄 Return Request #${orderId} - ₹${total} by ${customerName}`;

  // Method 1: Nodemailer SMTP
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: (process.env.SMTP_PORT || '465') === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: `"Gargee Medicose Returns" <${process.env.SMTP_USER}>`,
        to: ownerEmail,
        subject,
        html: htmlContent
      });
      emailSent = true;
    } catch (err) {
      errors.push({ method: 'nodemailer', error: err.message });
    }
  }

  // Method 2: Resend API
  if (!emailSent && process.env.RESEND_API_KEY) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Gargee Medicose <onboarding@resend.dev>',
          to: [ownerEmail],
          subject,
          html: htmlContent
        })
      });
      if (resp.ok) emailSent = true;
      else errors.push({ method: 'resend', error: await resp.text() });
    } catch (err) {
      errors.push({ method: 'resend', error: err.message });
    }
  }

  // Method 3: FormSubmit fallback
  if (!emailSent) {
    try {
      const targets = ['mahantpal123@gmail.com', 'spjgrowth@gmail.com'];
      for (const target of targets) {
        try {
          await fetch(`https://formsubmit.co/ajax/${target}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: 'https://gargee-medicose.vercel.app' },
            body: JSON.stringify({
              _subject: subject,
              _template: 'table',
              _captcha: 'false',
              'Order ID': orderId,
              'Customer Name': customerName,
              'Customer Phone': customerPhone,
              'Customer Email': customerEmail,
              'Return Reason': reason || 'Not provided',
              'Order Total': `₹${total}`,
              'Order Items': (items || []).map(i => `${i.name} x${i.quantity} - ₹${i.price * i.quantity}`).join(' | '),
              'Return Date': returnDate
            })
          });
          emailSent = true;
        } catch (e) {
          console.warn(`FormSubmit to ${target} failed:`, e);
        }
      }
    } catch (err) {
      errors.push({ method: 'formsubmit', error: err.message });
    }
  }

  // WhatsApp notification via CallMeBot
  let whatsappSent = false;
  const whatsappTarget = process.env.WHATSAPP_OWNER_PHONE || '+919993617796';
  const callMeBotKey = process.env.CALLMEBOT_API_KEY;

  if (callMeBotKey) {
    try {
      const waText = `🔄 *RETURN REQUEST #${orderId}*\nCustomer: ${customerName} (+91 ${customerPhone})\nAmount: Rs ${total}\nReason: ${reason || 'Not provided'}\nItems: ${(items || []).map(i => `${i.name} x${i.quantity}`).join(', ')}`;
      const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(whatsappTarget)}&text=${encodeURIComponent(waText)}&apikey=${callMeBotKey}`;
      await fetch(waUrl);
      whatsappSent = true;
    } catch (err) {
      console.warn('WhatsApp gateway error:', err);
    }
  }

  return res.status(200).json({ success: true, emailSent, whatsappSent, orderId, errors: errors.length > 0 ? errors : undefined });
}
