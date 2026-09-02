import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  User,
  Phone,
  Mail,
  Package,
  Heart,
  ShoppingBag,
  LogOut,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Clock,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export default function CustomerAccountPage() {
  const {
    currentCustomer,
    customerLogout,
    orders,
    wishlist,
    products,
    navigateTo,
    requestOrderReturn,
    businessInfo,
    showToast
  } = useShop();

  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  if (!currentCustomer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-heading text-xl font-bold text-slate-800">
          Please log in to view your account
        </h2>
        <button
          onClick={() => navigateTo('login')}
          className="bg-sky-500 text-white font-bold px-6 py-2.5 rounded-full text-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  const myOrders = orders.filter(
    (o) =>
      (currentCustomer.email && o.customer?.email?.toLowerCase() === currentCustomer.email.toLowerCase()) ||
      (currentCustomer.phone && (o.customer?.phone === currentCustomer.phone || o.customerPhone === currentCustomer.phone))
  );

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  // Helper to check 2-day return eligibility
  const checkReturnEligibility = (order) => {
    if (order.status === 'Return Requested' || order.status === 'Returned') {
      return { eligible: false, reason: 'Return request already submitted.' };
    }
    if (order.status !== 'Delivered') {
      return { eligible: false, reason: 'Return available only after order is Delivered.' };
    }

    const orderDate = new Date(order.deliveredAt || order.date);
    const now = new Date();
    const diffTime = Math.abs(now - orderDate);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays <= 2) {
      const hoursRemaining = Math.max(0, Math.floor((2 * 24) - (diffTime / (1000 * 60 * 60))));
      return { eligible: true, hoursRemaining };
    } else {
      return { eligible: false, reason: '2-Day Return window has expired for this order.' };
    }
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!returnReason.trim()) {
      alert("Please enter a reason for return.");
      return;
    }

    setIsSubmittingReturn(true);
    const success = requestOrderReturn(returnModalOrder.orderId, returnReason.trim());

    if (success) {
      const message = `🔄 *RETURN REQUEST - GARGEE MEDICOSE* 🔄\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *Order ID:* #${returnModalOrder.orderId}\n` +
        `👤 *Customer:* ${returnModalOrder.customer?.name || currentCustomer.name}\n` +
        `📱 *Phone:* +91 ${returnModalOrder.customer?.phone || currentCustomer.phone}\n` +
        `💰 *Order Amount:* Rs ${returnModalOrder.total}\n` +
        `📝 *Reason:* ${returnReason.trim()}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Please schedule pickup/replacement for this order.`;

      const targetPhone = (businessInfo?.phone || '9993617796').replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/91${targetPhone}?text=${encodeURIComponent(message)}`;

      try {
        window.open(whatsappUrl, '_blank');
      } catch (err) {
        console.warn("Popup blocked:", err);
      }

      setReturnModalOrder(null);
      setReturnReason('');
    }
    setIsSubmittingReturn(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md shadow-sky-500/20">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-heading font-black text-2xl border border-white/30 shrink-0">
            {currentCustomer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
              Pet Parent Member
            </span>
            <h1 className="font-heading text-2xl font-black mt-1">
              {currentCustomer.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-sky-100 justify-center sm:justify-start mt-1">
              {currentCustomer.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{currentCustomer.email}</span>
                </span>
              )}
              {currentCustomer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>+91 {currentCustomer.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={customerLogout}
          className="bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-600" />
              <span>My Orders ({myOrders.length})</span>
            </h2>
            <button
              onClick={() => navigateTo('shop')}
              className="text-xs font-bold text-sky-600 hover:underline"
            >
              Shop More
            </button>
          </div>

          {myOrders.length > 0 ? (
            <div className="space-y-4">
              {myOrders.map((ord) => {
                const returnStatus = checkReturnEligibility(ord);
                return (
                  <div
                    key={ord.orderId}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-heading font-black text-slate-900 text-sm">
                          Order #{ord.orderId}
                        </span>
                        <p className="text-[11px] text-slate-400">Placed on {ord.date}</p>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : ord.status === 'Return Requested'
                            ? 'bg-purple-100 text-purple-700'
                            : ord.status === 'Processing'
                            ? 'bg-sky-100 text-sky-700'
                            : ord.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sky-600">x{item.quantity}</span>
                            <span className="text-slate-800 font-medium">{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-900">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">
                          Payment Mode: <strong className="text-slate-700 uppercase">{ord.customer?.paymentMethod || 'UPI Online'}</strong>
                        </span>
                        <span className="font-heading font-black text-sm text-slate-900 block mt-0.5">
                          Total: ₹{ord.total.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* 2-Day Return Option Button */}
                      {ord.status === 'Delivered' && (
                        returnStatus.eligible ? (
                          <button
                            onClick={() => setReturnModalOrder(ord)}
                            className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            <span>Request 2-Day Return</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 italic">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Return Window Closed</span>
                          </span>
                        )
                      )}

                      {ord.status === 'Return Requested' && (
                        <div className="bg-purple-50 text-purple-800 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                          <span>Return Under Processing</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">You have not placed any orders yet.</p>
              <button
                onClick={() => navigateTo('shop')}
                className="bg-sky-500 text-white font-bold px-5 py-2 rounded-full text-xs"
              >
                Browse Pet Supplies
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-current" />
            <span>Saved Items ({wishlist.length})</span>
          </h2>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            {wishlistedProducts.length > 0 ? (
              <div className="space-y-3">
                {wishlistedProducts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigateTo('product', { productId: item.id })}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-contain bg-slate-50 p-1"
                    />
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="font-black text-slate-900 mt-0.5">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                No items saved to your wishlist yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-100 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="font-heading font-extrabold text-base">
                  Request 2-Day Return
                </h3>
              </div>
              <button
                onClick={() => setReturnModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Order #{returnModalOrder.orderId}</p>
              <p className="text-[11px] text-amber-800">
                Gargee Medicose 2-Day Return & Replacement Policy guarantees easy resolution for damaged or incorrect items within 48 hours of delivery.
              </p>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Reason for Return *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Damaged outer box, wrong size, or expired product"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3 rounded-full transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Submit & Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
