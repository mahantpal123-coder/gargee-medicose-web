import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { sendOrderNotificationEmail } from '../utils/orderEmail';
import { CheckCircle2, ShieldCheck, ArrowLeft, Phone, CreditCard, Loader2, Truck, Copy, Check } from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    deliveryFee,
    cartTotal,
    clearCart,
    currentCustomer,
    navigateTo,
    businessInfo
  } = useShop();

  const [formData, setFormData] = useState({
    name: currentCustomer?.name || '',
    phone: currentCustomer?.phone || '',
    email: currentCustomer?.email || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'razorpay',
    notes: '',
    website_hp: ''
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.address) {
      alert("Please fill in your Name, Phone Number, and Address.");
      return;
    }

    setIsSubmitting(true);

    const generatedOrderId = 'GM-' + Math.floor(100000 + Math.random() * 900000);
    const customerId = currentCustomer?.uid || null;

    const order = {
      orderId: generatedOrderId,
      id: generatedOrderId,
      customerId: customerId,
      items: cart.map((item) => ({
        id: item.productId || item.id,
        productId: item.productId || item.id,
        name: item.name,
        price: item.price,
        unitPrice: item.price,
        priceAtPurchase: item.price,
        quantity: item.quantity,
        image: item.image,
        sku: item.sku || null,
        lineTotal: item.price * item.quantity
      })),
      customer: {
        ...formData,
        uid: customerId
      },
      total: cartTotal,
      subtotal: cartSubtotal,
      delivery: deliveryFee,
      paymentMethod: 'Razorpay (Cards/UPI/NetBanking)',
      status: 'Pending Payment',
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    };

    const itemsSummary = (order.items || [])
      .map((item, idx) => `${idx + 1}. ${item.name} (x${item.quantity}) - Rs ${item.price * item.quantity}`)
      .join('\n');

    const whatsappMessage = `🐾 *NEW PAID ORDER - GARGEE MEDICOSE* 🐾\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Order ID:* #${order.orderId}\n` +
      `📅 *Date:* ${order.date}\n` +
      `👤 *Customer:* ${order.customer.name}\n` +
      `📱 *Phone:* +91 ${order.customer.phone}\n` +
      `📍 *Address:* ${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}\n` +
      `💳 *Payment Method:* ${order.paymentMethod}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 *ITEMS ORDERED:*\n${itemsSummary}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Subtotal:* Rs ${order.subtotal}\n` +
      `🚚 *Delivery:* ${order.delivery === 0 ? 'FREE' : `Rs ${order.delivery}`}\n` +
      `💰 *TOTAL PAID:* Rs ${order.total}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Razorpay Payment Verified. Please dispatch order.`;

    const targetPhone = (businessInfo?.phone || '9993617796').replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/91${targetPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert("Failed to load Razorpay SDK. Please check your internet connection.");
        setIsSubmitting(false);
        return;
      }

      // Backend recalculates verified prices and sets exact amount
      const rzpOrderResp = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: order.items,
          amount: cartTotal,
          receipt: generatedOrderId
        })
      });

      const rzpOrderData = await rzpOrderResp.json();
      if (!rzpOrderData.success) {
        alert("Could not initiate Razorpay payment: " + (rzpOrderData.error || "Server configuration missing"));
        setIsSubmitting(false);
        return;
      }

      const options = {
        key: rzpOrderData.keyId,
        amount: rzpOrderData.amount,
        currency: rzpOrderData.currency,
        name: "Gargee Medicose",
        description: `Order #${generatedOrderId} Payment`,
        order_id: rzpOrderData.razorpayOrderId,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: { color: "#0284c7" },
        handler: async function (response) {
          try {
            const verifyResp = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: order
              })
            });

            const verifyData = await verifyResp.json();
            if (verifyData.success) {
              sendOrderNotificationEmail(verifyData.order || order).catch((err) =>
                console.error("Order notification email error:", err)
              );

              setPlacedOrderDetails({ ...(verifyData.order || order), whatsappUrl });
              setOrderPlaced(true);
              clearCart();
              setIsSubmitting(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              const payRef = verifyData.razorpayPaymentId
                ? `\n\nPayment ID: ${verifyData.razorpayPaymentId}\nYour money was deducted. Contact support with this ID — do not pay again.`
                : "";
              alert("Payment verification failed: " + (verifyData.error || "Invalid payment signature") + payRef);
              setIsSubmitting(false);
            }
          } catch (vErr) {
            alert("Backend verification error: " + vErr.message);
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            alert("Payment cancelled. Your cart items are safe.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.error("Razorpay Payment failed:", resp.error);
        alert("Payment Failed: " + (resp.error?.description || "Transaction declined"));
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay setup error:", err);
      alert("Failed to launch Razorpay gateway: " + err.message);
      setIsSubmitting(false);
    }
  };

  if (orderPlaced && placedOrderDetails) {
    const orderId = placedOrderDetails.orderId;
    const customerEmail = placedOrderDetails.customer?.email || '';

    const handleCopyOrderId = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(orderId);
        setCopiedOrderId(true);
        setTimeout(() => setCopiedOrderId(false), 2000);
      }
    };

    const handleGoToTracking = () => {
      navigateTo('track');
      if (window.history && window.history.replaceState) {
        const newUrl = `${window.location.pathname}?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(customerEmail)}`;
        window.history.replaceState({}, '', newUrl);
      }
    };

    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block">
              Order Confirmed & Payment Verified
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Thank You for Your Order!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              We're preparing your pet's essentials with care.
            </p>
          </div>

          {/* Prominent Order ID with Copy */}
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
                Your Unique Order ID
              </span>
              <span className="font-heading font-black text-xl text-slate-900 tracking-wide">
                #{orderId}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Save this number to track your delivery at any time.
              </p>
            </div>
            <button
              onClick={handleCopyOrderId}
              className="bg-white hover:bg-sky-100 text-sky-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-sky-200 flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
            >
              {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedOrderId ? 'Copied!' : 'Copy Order ID'}</span>
            </button>
          </div>

          {/* Purchased Items Snapshot */}
          <div className="text-left space-y-2">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Purchased Items ({(placedOrderDetails.items || []).length})
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
              {(placedOrderDetails.items || []).map((item, idx) => {
                const price = Number(item.priceAtPurchase || item.price || 0);
                const qty = Number(item.quantity || 1);
                const lineTotal = Number(item.lineTotal || price * qty);

                return (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-contain rounded-lg border border-slate-100 bg-slate-50 p-1 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {qty} × ₹{price.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery & Payment details summary */}
          <div className="bg-slate-50 rounded-2xl p-5 text-left text-xs space-y-2.5 border border-slate-100">
            <div className="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
              <span>Customer:</span>
              <span>{placedOrderDetails.customer?.name} ({placedOrderDetails.customer?.phone})</span>
            </div>
            <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-2">
              <span>Delivery Address:</span>
              <span className="text-right max-w-xs">{placedOrderDetails.customer?.address}, {placedOrderDetails.customer?.city} - {placedOrderDetails.customer?.pincode}</span>
            </div>
            <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-2">
              <span>Payment Mode:</span>
              <span className="font-bold text-slate-800">{placedOrderDetails.paymentMethod}</span>
            </div>
            {placedOrderDetails.razorpayPaymentId && (
              <div className="flex justify-between text-emerald-700 font-bold border-b border-slate-200 pb-2">
                <span>Razorpay Payment ID:</span>
                <span>{placedOrderDetails.razorpayPaymentId}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1">
              <span>Total Amount Paid:</span>
              <span className="text-sky-600">₹{Number(placedOrderDetails.total || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={handleGoToTracking}
              className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white font-bold px-7 py-3 rounded-full text-xs transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Track Delivery Progress</span>
            </button>

            {currentCustomer && (
              <button
                onClick={() => navigateTo('account')}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3 rounded-full text-xs transition cursor-pointer"
              >
                View in My Account
              </button>
            )}

            <a
              href={placedOrderDetails.whatsappUrl || businessInfo.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-full text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
            >
              <Phone className="w-4 h-4" />
              <span>WhatsApp Receipt</span>
            </a>
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
          Fast and reliable pet food & supplies delivery across India
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Invisible bot honeypot field */}
        <input
          type="text"
          name="website_hp"
          value={formData.website_hp}
          onChange={handleInputChange}
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none', position: 'absolute', left: '-9999px' }}
        />
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
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Razorpay Secured
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl border-2 border-sky-500 bg-sky-50/50 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-sky-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Razorpay Online Payment (Cards, UPI, Netbanking, Wallets)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Pay securely using Google Pay, PhonePe, Paytm, BHIM UPI, Credit/Debit Cards, or Netbanking. Instant order confirmation upon successful payment verification.
                </p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-[11px] text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% encrypted SSL transaction & instant order verification.</span>
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
                      <span className="text-slate-600 line-clamp-1 max-w-[180px]">
                        {item.name} {item.selectedVariant && `(${item.selectedVariant.size})`}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:opacity-50 text-white font-bold py-4 rounded-full text-sm transition shadow-lg shadow-sky-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Now via Razorpay (₹{cartTotal.toLocaleString('en-IN')})</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Direct verification & fast store dispatch</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
