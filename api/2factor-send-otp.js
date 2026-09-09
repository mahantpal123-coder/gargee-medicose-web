import https from 'https';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { phone } = req.body || req.query || {};
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid Indian mobile number. Enter a valid 10-digit number.' });
    }

    const apiKey = process.env.TWOFACTOR_API_KEY || process.env.VITE_TWOFACTOR_API_KEY || '';
    const fullMobile = `91${cleanPhone}`;

    // Test mode fallback if no API key configured yet
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        message: `OTP sent (Test mode: Use 123456 to login)`,
        sessionId: `test_session_${Date.now()}`,
        phone: cleanPhone,
        testMode: true
      });
    }

    const templateName = process.env.TWOFACTOR_TEMPLATE_NAME || 'OTPSMS';
    const urlPath = `/API/V1/${apiKey}/SMS/${fullMobile}/AUTOGEN/${encodeURIComponent(templateName)}`;

    const options = {
      hostname: '2factor.in',
      path: urlPath,
      method: 'GET'
    };

    const tfResult = await new Promise((resolve) => {
      const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => { data += chunk; });
        apiRes.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve({ Status: 'Error', Details: data }); }
        });
      });
      apiReq.on('error', (err) => resolve({ Status: 'Error', Details: err.message }));
      apiReq.end();
    });

    if (tfResult.Status !== 'Success') {
      return res.status(400).json({
        error: tfResult.Details || '2Factor failed to send OTP. Check API key or SMS credits.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}`,
      sessionId: tfResult.Details,
      phone: cleanPhone
    });
  } catch (err) {
    console.error('Error sending 2Factor OTP:', err);
    return res.status(500).json({ error: 'Server error while sending OTP. Please try again.' });
  }
}
