/**
 * Validate Indian Mobile Number format (10 digits starting with 6-9)
 */
export function validateIndianPhone(phone) {
  const clean = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!clean || !/^[6-9]\d{9}$/.test(clean)) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
      cleanPhone: ''
    };
  }
  return {
    isValid: true,
    error: null,
    cleanPhone: clean
  };
}

/**
 * Send OTP via 2Factor Server Endpoint
 */
export async function sendTwoFactorOtp(phone) {
  const validation = validateIndianPhone(phone);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  try {
    const res = await fetch('/api/2factor-send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: validation.cleanPhone })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error || 'Failed to send OTP.' };
    }

    return {
      success: true,
      message: data.message || `OTP sent to +91 ${validation.cleanPhone}`,
      phone: validation.cleanPhone,
      sessionId: data.sessionId,
      testMode: !!data.testMode
    };
  } catch (err) {
    console.error('Error in sendTwoFactorOtp:', err);
    return { success: false, error: 'Network failure while sending OTP. Check connection.' };
  }
}

/**
 * Verify OTP via 2Factor Server Endpoint
 */
export async function verifyTwoFactorOtp(phone, otp, sessionId = null) {
  const validation = validateIndianPhone(phone);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const cleanOtp = String(otp || '').trim();
  if (!cleanOtp || cleanOtp.length < 4 || cleanOtp.length > 6) {
    return { success: false, error: 'Enter a valid 4 to 6 digit OTP.' };
  }

  try {
    const res = await fetch('/api/2factor-verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: validation.cleanPhone,
        otp: cleanOtp,
        sessionId: sessionId
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error || 'OTP verification failed.' };
    }

    return {
      success: true,
      uid: data.uid,
      phone: data.phone,
      fullPhone: data.fullPhone,
      phoneVerified: true,
      customToken: data.customToken,
      customerProfile: data.customerProfile,
      message: data.message || 'Mobile number verified successfully.'
    };
  } catch (err) {
    console.error('Error in verifyTwoFactorOtp:', err);
    return { success: false, error: 'Network failure during verification.' };
  }
}
