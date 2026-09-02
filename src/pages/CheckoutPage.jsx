import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { sendOrderNotificationEmail } from '../utils/orderEmail';
import { CheckCircle2, ShieldCheck, ArrowLeft, Phone, CreditCard, Loader2, AlertCircle } from 'lucide-react';

export default function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    deliveryFee,
    cartTotal,
    clearCart,
    addOrder,
    currentCustomer,
    navigateTo,
    businessInfo
  } = useShop();

  const [formData, setFormData] = useState({
    name: currentCustomer?.name || '',
    phone: currentCustomer?.phone || '',
    email: currentCustomer?.email || '',
    address: '',
    city: 'Bilaspur',
    state: 'Chhattisgarh',
    pincode: '495001',
    paymentMethod: 'razorpay',
    notes: ''
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const finalizeOrder = (paymentId, orderId) => {
    const generatedOrderId = 'GM-' + Math.floor(100000 + Math.random() * 900000);
    const order = {
      orderId: generatedOrderId,
      razorpayOrderId: orderId || null,
      razorpayPaymentId: paymentId || null,
      items: cart,
      customer: formData,
      total: cartTotal,
      subtotal: cartSubtotal,
      delivery: deliveryFee,
      status: "Paid",
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    };

    sendOrderNotificationEmail(order).catch((err) =>
      console.error("Order notification email error:", err)
    );

    const itemsSummary = (order.items || [])
      .map((item, idx) => `${idx + 1}. ${item.name} (x${item.quantity}) - Rs ${item.price * item.quantity}`)
      .join('\n');

    const whatsappMessage = `🐾 *NEW ORDER - GARGEE MEDICOSE* 🐾\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Order ID:* #${order.orderId}\n` +
      `📅 *Date:* ${order.date}\n` +
      `👤 *Customer:* ${order.customer.name}\n` +
      `📱 *Phone:* +91 ${order.customer.phone}\n` +
      `📍 *Address:* ${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 *ITEMS ORDERED:*\n${itemsSummary}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Subtotal:* Rs ${order.subtotal}\n` +
      `🚚 *Delivery:* ${order.delivery === 0 ? 'FREE' : `Rs ${order.delivery}`}\n` +
      `💰 *TOTAL AMOUNT:* Rs ${order.total}\n` +
      `💳 *Payment:* RAZORPAY ONLINE (ID: ${paymentId || 'Verified'})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Please confirm and dispatch this order.`;

    const targetPhone = (businessInfo?.phone || '9993617796').replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/91${targetPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    addOrder(order);
    setPlacedOrderDetails({ ...order, whatsappUrl });
    setOrderPlaced(true);
    clearCart();
    setIsSubmitting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      window.open(whatsappUrl, '_blank');
    } catch (e) {
      console.warn("Auto popup blocked:", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');

    if (!formData.name || !formData.phone || !formData.address) {
      alert("Please fill in your Name, Phone Number, and Address.");
      return;
    }

    const amountInPaise = Math.round(cartTotal * 100);
    if (amountInPaise < 100) {
      alert("Order total must be at least ₹1.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create Razorpay Order via Serverless API
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          receipt: `gm_${Date.now()}`
        })
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to initialize payment gateway.');
      }

      // Step 2: Open Razorpay Standard Checkout Modal
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TW2BW4tR7JBxd7';

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Gargee Medicose',
        description: `Pet Essentials Order (${cart.length} items)`,
        image: '/logo.png',
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            // Step 3: Verify Payment Signature via Serverless API
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              finalizeOrder(response.razorpay_payment_id, response.razorpay_order_id);
            } else {
              setPaymentError(verifyData.error || 'Payment verification failed. Please contact support.');
              setIsSubmitting(false);
            }
          } catch (verifyErr) {
            console.error('Verification Request Failed:', verifyErr);
            setPaymentError('Network error while verifying payment signature.');
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        notes: {
          address: formData.address,
          city: formData.city
        },
        theme: {
          color: '#0284c7'
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setPaymentError('Payment cancelled by user.');
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          console.error('Payment Failed Event:', response.error);
          setPaymentError(response.error.description || 'Payment process failed.');
          setIsSubmitting(false);
        });
        rzp.open();
      } else {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      setPaymentError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  if (orderPlaced && placedOrderDetails) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Payment Successful & Order Confirmed
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Thank You for Your Order!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Order #{placedOrderDetails.orderId} • We're preparing your pet's essentials
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 text-left text-xs space-y-3 border border-slate-100">
            <div className="flex justify-between font-bold text-slate-800 border-b pb-2">
              <span>Customer:</span>
              <span>{placedOrderDetails.customer.name} ({placedOrderDetails.customer.phone})</span>
            </div>
            <div className="flex justify-between text-slate-600 border-b pb-2">
              <span>Delivery Address:</span>
              <span className="text-right max-w-xs">{placedOrderDetails.customer.address}, {placedOrderDetails.customer.city} - {placedOrderDetails.customer.pincode}</span>
            </div>
            <div className="flex justify-between text-slate-600 border-b pb-2">
              <span>Payment Reference:</span>
              <span className="font-bold text-emerald-600 font-mono">{placedOrderDetails.razorpayPaymentId || 'Verified'}</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1">
              <span>Total Paid:</span>
              <span className="text-sky-600">₹{placedOrderDetails.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2 text-xs">
            <p className="font-bold text-sky-900">
              Order Dispatched via Gargee Medicose
            </p>
            <p className="text-[11px] text-slate-600">
              Your payment of <strong>₹{placedOrderDetails.total}</strong> has been securely processed via Razorpay. Order details have been sent to WhatsApp.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={placedOrderDetails.whatsappUrl || businessInfo.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-full text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
            >
              <Phone className="w-4 h-4" />
              <span>Send Full Order & Receipt on WhatsApp</span>
            </a>
            <button
              onClick={() => navigateTo('home')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-full text-xs transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-heading text-xl font-bold text-slate-800">Your cart is empty</h2>
        <button
          onClick={() => navigateTo('shop')}
          className="bg-sky-500 text-white font-bold px-6 py-2.5 rounded-full text-xs"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <button
          onClick={() => navigateTo('cart')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 transition bg-white px-4 py-2 rounded-full border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </button>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4">
          Checkout & Delivery Details
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Fast and reliable pet food & supplies delivery in Bilaspur
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-heading font-bold text-slate-900 text-base">
              1. Contact & Shipping Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Address (Optional)</label>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Street Address / House No. / Landmark *</label>
              <textarea
                name="address"
                required
                rows="3"
                placeholder="Flat / House No., Colony / Street, Landmark"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              ></textarea>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-slate-900 text-base">
                2. Payment Method
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                Instant Razorpay Gateway
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl border-2 border-sky-500 bg-sky-50/40 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={true}
                    readOnly
                    className="accent-sky-600 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Razorpay Secure (UPI, GPay, PhonePe, Paytm, Cards, NetBanking)</span>
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Instant verification with 256-bit encryption. Supports all UPI apps, Credit/Debit cards & NetBanking.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-sky-200/80 text-[11px] text-slate-700 flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-slate-500">Supported Methods:</span>
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-[10px]">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">UPI / QR</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Google Pay</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">PhonePe</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Cards</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">NetBanking</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-[11px] text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% secure direct online payment powered by Razorpay.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 sticky top-24">
            <h3 className="font-heading font-bold text-slate-900 text-base border-b pb-4">
              Your Order Summary ({cart.length} items)
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => {
                const itemKey = item.cartItemId || item.id;
                return (
                <div key={itemKey} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">x{item.quantity}</span>
                    <span className="text-slate-600 line-clamp-1 max-w-[180px]">{item.name} {item.selectedVariant && `(${item.selectedVariant.size})`}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              );})}
            </div>

            <div className="border-t pt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-bold text-emerald-600">
                  {deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-base font-heading font-black text-slate-900">
                <span>Total Due</span>
                <span className="text-sky-600">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {paymentError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:opacity-50 text-white font-bold py-4 rounded-full text-sm transition shadow-lg shadow-sky-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Razorpay Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{cartTotal.toLocaleString('en-IN')} with Razorpay</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Safe & Secure 256-bit Razorpay Checkout</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
