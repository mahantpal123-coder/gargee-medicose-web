import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { sendOrderNotificationEmail } from '../utils/orderEmail';
import { CheckCircle2, ShieldCheck, ArrowLeft, Phone, Wallet, Loader2 } from 'lucide-react';

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
    paymentMethod: 'online_upi',
    notes: ''
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.address) {
      alert("Please fill in your Name, Phone Number, and Address.");
      return;
    }

    setIsSubmitting(true);

    const generatedOrderId = 'GM-' + Math.floor(100000 + Math.random() * 900000);
    const order = {
      orderId: generatedOrderId,
      items: cart,
      customer: formData,
      total: cartTotal,
      subtotal: cartSubtotal,
      delivery: deliveryFee,
      paymentMethod: 'Online Payment (UPI/QR on WhatsApp)',
      status: "Pending Confirmation",
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
      `💳 *Payment Method:* ${order.paymentMethod}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 *ITEMS ORDERED:*\n${itemsSummary}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Subtotal:* Rs ${order.subtotal}\n` +
      `🚚 *Delivery:* ${order.delivery === 0 ? 'FREE' : `Rs ${order.delivery}`}\n` +
      `💰 *TOTAL AMOUNT:* Rs ${order.total}\n` +
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

  if (orderPlaced && placedOrderDetails) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Order Submitted Successfully
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
              <span>Payment Option:</span>
              <span className="font-bold text-slate-800">{placedOrderDetails.paymentMethod}</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1">
              <span>Total Payable:</span>
              <span className="text-sky-600">₹{placedOrderDetails.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2 text-xs">
            <p className="font-bold text-sky-900">
              Confirm your order on WhatsApp
            </p>
            <p className="text-[11px] text-slate-600">
              Order details were generated and sent to WhatsApp. Click below if WhatsApp did not open automatically.
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
              <span>Send Order on WhatsApp</span>
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
                Online Payment Only
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl border-2 border-sky-500 bg-sky-50/40 space-y-3">
                <div className="flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">
                      Online Payment via UPI / QR Code (WhatsApp Instant Pay)
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Cash on Delivery is currently disabled. Pay online securely using UPI (Google Pay, PhonePe, Paytm, BHIM) or QR Code provided on WhatsApp upon order confirmation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-[11px] text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% online payment verification before dispatch.</span>
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
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-full text-sm transition shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  <span>Place Order via WhatsApp (₹{cartTotal.toLocaleString('en-IN')})</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Direct WhatsApp confirmation & fast store dispatch</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
