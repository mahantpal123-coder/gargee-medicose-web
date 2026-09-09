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

    // Test mode fallback if no API key configured
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        message: `OTP sent via SMS (Test mode: Use 123456 to login)`,
        sessionId: `test_session_${Date.now()}`,
        phone: cleanPhone,
        testMode: true
      });
    }

    // Official 2Factor SMS OTP API endpoint enforcing SMS channel and optional custom DLT Template
    const templateName = process.env.TWOFACTOR_TEMPLATE_NAME || '';
    const urlPath = templateName
      ? `/API/V1/${apiKey}/SMS/${fullMobile}/AUTOGEN/${encodeURIComponent(templateName)}?channel=SMS`
      : `/API/V1/${apiKey}/SMS/${fullMobile}/AUTOGEN?channel=SMS`;

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
        error: tfResult.Details || '2Factor failed to send SMS OTP. Check SMS credit balance or API key.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone} via SMS`,
      sessionId: tfResult.Details,
      phone: cleanPhone
    });
  } catch (err) {
    console.error('Error sending 2Factor SMS OTP:', err);
    return res.status(500).json({ error: 'Server error while sending SMS OTP. Please try again.' });
  }
}
