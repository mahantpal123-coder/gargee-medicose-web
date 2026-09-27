import nodemailer from 'nodemailer';

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { name, phone, petType, message } = req.body || {};
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Name and phone are required' });
  }

  const ownerEmail = process.env.INQUIRY_EMAIL || process.env.OWNER_EMAIL || 'spjgrowth@gmail.com';
  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safePet = escapeHtml(petType || 'Dog');
  const safeMessage = escapeHtml(message || 'No message');
  const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const htmlContent = `
  <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;">
    <h2 style="color: #0284c7; margin-top: 0;">📩 New Customer Inquiry</h2>
    <table style="width: 100%; font-size: 14px; color: #334155; line-height: 1.8;">
      <tr><td style="font-weight: 600; color: #64748b; width: 35%;">Name:</td><td style="font-weight: 700;">${safeName}</td></tr>
      <tr><td style="font-weight: 600; color: #64748b;">Phone:</td><td><a href="tel:+91${safePhone.replace(/\D/g, '')}" style="color: #0284c7;">+91 ${safePhone}</a></td></tr>
      <tr><td style="font-weight: 600; color: #64748b;">Pet Type:</td><td>${safePet}</td></tr>
      <tr><td style="font-weight: 600; color: #64748b; vertical-align: top;">Message:</td><td>${safeMessage}</td></tr>
      <tr><td style="font-weight: 600; color: #64748b;">Date:</td><td>${date}</td></tr>
    </table>
    <div style="margin-top: 16px; text-align: center;">
      <a href="https://wa.me/91${safePhone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(safeName)}%2C%20thank%20you%20for%20reaching%20out%20to%20Gargee%20Medicose."
         style="display: inline-block; background: #22c55e; color: #fff; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 30px; font-size: 13px;">
         💬 Reply on WhatsApp
      </a>
    </div>
  </div>`;

  let emailSent = false;

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
        to: ownerEmail,
        subject: `📩 New Inquiry from ${name} (${petType || 'Pet'})`,
        html: htmlContent
      });

      emailSent = true;
    } catch (err) {
      console.warn('Inquiry email error:', err.message);
    }
  }

  return res.status(200).json({ success: true, emailSent });
}
