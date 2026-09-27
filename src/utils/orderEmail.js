/**
 * Dispatches full order notification email to owner via backend SMTP
 */
export async function sendOrderNotificationEmail(order) {
  try {
    const res = await fetch('/api/send-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Order email dispatch error:', err);
  }
  return true;
}
