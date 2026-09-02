/**
 * Dispatches full order notification email to owner (mahantpal123@gmail.com)
 */
export async function sendOrderNotificationEmail(order) {
  const { orderId, date, customer, items, subtotal, delivery, total } = order;

  const payload = {
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
  };

  
  try {
    const res = await fetch('/api/send-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    });
    if (res.ok) {
      const data = await res.json();
      console.log('Order email dispatched via serverless function:', data);
    }
  } catch (err) {
    console.warn('Serverless email dispatch error:', err);
  }

  
  try {
    const targets = ['mahantpal123@gmail.com'];
    for (const target of targets) {
      fetch(`https://formsubmit.co/ajax/${target}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch((e) => console.warn(`Direct client email fallback (${target}):`, e));
    }
  } catch (err) {
    console.warn('Direct client email fallback error:', err);
  }

  return true;
}
