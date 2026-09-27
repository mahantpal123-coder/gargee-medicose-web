import React, { useState, useEffect } from 'react';
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
  X,
  Truck,
  MapPin,
  CreditCard,
  ExternalLink,
  Loader2,
  Link as LinkIcon
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'Order Received', label: 'Order Received', icon: Clock },
  { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'Processing', label: 'Processing', icon: Package },
  { key: 'Shipped', label: 'Shipped', icon: Truck },
  { key: 'Delivered', label: 'Delivered', icon: ShieldCheck }
];

function normalizeStatus(status = '') {
  const s = String(status).toUpperCase();
  if (s.includes('DELIVERED')) return 'Delivered';
  if (s.includes('SHIP') || s.includes('DISPATCH')) return 'Shipped';
  if (s.includes('PROCESS') || s.includes('READY')) return 'Processing';
  if (s.includes('CONFIRM')) return 'Confirmed';
  if (s.includes('CANCEL')) return 'Cancelled';
  if (s.includes('RETURN')) return 'Returned';
  return 'Order Received';
}

function getStepIndex(normalizedStatus) {
  const idx = STATUS_STEPS.findIndex((step) => step.key === normalizedStatus);
  return idx >= 0 ? idx : 0;
}

export default function CustomerAccountPage() {
  const {
    currentCustomer,
    customerLogout,
    orders: contextOrders,
    wishlist,
    products,
    navigateTo,
    businessInfo,
    showToast
  } = useShop();

  const [dbOrders, setDbOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [claiming, setClaiming] = useState(false);

  // Fetch verified customer orders from backend
  const fetchCustomerOrders = async () => {
    if (!currentCustomer) return;
    const email = currentCustomer.email || '';
    const customerId = currentCustomer.uid || '';
    if (!email && !customerId) return;

    try {
      setLoadingOrders(true);
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (customerId) params.append('customerId', customerId);

      const resp = await fetch(`/api/customer/orders?${params.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && Array.isArray(data.orders)) {
          setDbOrders(data.orders);
        }
      }
    } catch (err) {
      console.warn('Customer orders fetch error:', err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchCustomerOrders();
  }, [currentCustomer]);

  if (!currentCustomer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-heading text-xl font-bold text-slate-800">
          Please log in to view your account
        </h2>
        <button
          onClick={() => navigateTo('login')}
          className="bg-sky-500 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-md cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Merge context orders with backend orders, deduplicated by orderId/id
  const orderMap = new Map();
  dbOrders.forEach((o) => {
    const key = String(o.orderId || o.id);
    orderMap.set(key, o);
  });

  (contextOrders || [])
    .filter(
      (o) =>
        (currentCustomer.email && o.customer?.email?.toLowerCase() === currentCustomer.email.toLowerCase()) ||
        (currentCustomer.phone && (o.customer?.phone === currentCustomer.phone || o.customerPhone === currentCustomer.phone)) ||
        (currentCustomer.uid && o.customerId === currentCustomer.uid)
    )
    .forEach((o) => {
      const key = String(o.orderId || o.id);
      if (!orderMap.has(key)) {
        orderMap.set(key, o);
      }
    });

  const myOrders = Array.from(orderMap.values());
  const wishlistedProducts = (products || []).filter((p) => wishlist.includes(p.id));

  // Handle claiming previous guest orders with matching email
  const handleClaimGuestOrders = async () => {
    if (!currentCustomer.email) {
      if (showToast) showToast('Account must have an email to link past orders.', 'error');
      return;
    }

    try {
      setClaiming(true);
      const resp = await fetch('/api/customer/orders/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentCustomer.uid || currentCustomer.email,
          email: currentCustomer.email
        })
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        if (showToast) {
          showToast(
            data.claimedCount > 0
              ? `Success! Linked ${data.claimedCount} previous order(s) to your account.`
              : 'All previous orders matching your email are already linked.',
            'success'
          );
        }
        await fetchCustomerOrders();
      } else {
        if (showToast) showToast(data.error || 'Failed to link previous orders', 'error');
      }
    } catch (err) {
      console.error('Claim error:', err);
      if (showToast) showToast('Network error while linking past orders.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md shadow-sky-500/20">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-heading font-black text-2xl border border-white/30 shrink-0">
            {currentCustomer.name ? currentCustomer.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                Pet Parent Member
              </span>
              {currentCustomer.emailVerified && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-400 text-emerald-950 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Email</span>
                </span>
              )}
            </div>
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
                <span className="flex items-center gap-1 font-semibold">
                  <Phone className="w-3.5 h-3.5" />
                  <span>+91 {currentCustomer.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentCustomer.email && (
            <button
              onClick={handleClaimGuestOrders}
              disabled={claiming}
              title="Link previous guest orders made with this email"
              className="bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {claiming ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LinkIcon className="w-3.5 h-3.5" />
              )}
              <span>Link Past Orders</span>
            </button>
          )}

          <button
            onClick={customerLogout}
            className="bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-600" />
              <span>My Orders ({myOrders.length})</span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo('track')}
                className="text-xs font-bold text-slate-600 hover:text-sky-600 flex items-center gap-1"
              >
                <Truck className="w-3.5 h-3.5 text-sky-500" />
                <span>Track By ID</span>
              </button>
              <button
                onClick={() => navigateTo('shop')}
                className="text-xs font-bold text-sky-600 hover:underline"
              >
                Shop More
              </button>
            </div>
          </div>

          {loadingOrders ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto" />
              <p className="text-xs text-slate-400">Loading your orders...</p>
            </div>
          ) : myOrders.length > 0 ? (
            <div className="space-y-4">
              {myOrders.map((ord) => {
                const orderId = ord.orderId || ord.id;
                const orderTotal = Number(ord.total || 0);
                const orderStatus = ord.status || 'Order Received';
                const itemsList = ord.items || [];

                return (
                  <div
                    key={orderId}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-3 hover:border-sky-200 transition"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-heading font-black text-slate-900 text-sm">
                          Order #{orderId}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Placed on {ord.date || 'Recent'}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                          orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : orderStatus === 'Cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : orderStatus === 'Return Requested' || orderStatus === 'Returned'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {orderStatus}
                      </span>
                    </div>

                    {/* Preview of items */}
                    <div className="space-y-2">
                      {itemsList.slice(0, 3).map((item, idx) => {
                        const price = Number(item.priceAtPurchase || item.price || 0);
                        const qty = Number(item.quantity || 1);
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-black text-sky-600 shrink-0">x{qty}</span>
                              <span className="text-slate-800 font-medium truncate">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-900 shrink-0 ml-2">
                              ₹{(price * qty).toLocaleString('en-IN')}
                            </span>
                          </div>
                        );
                      })}
                      {itemsList.length > 3 && (
                        <p className="text-[11px] text-slate-400 italic">
                          +{itemsList.length - 3} more item(s)...
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">
                          Payment: <strong className="text-slate-700">{ord.paymentMethod || 'Online'}</strong> ({ord.paymentStatus || 'Paid'})
                        </span>
                        <span className="font-heading font-black text-base text-slate-900 block mt-0.5 text-sky-600">
                          Total: ₹{orderTotal.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            const email = ord.customer?.email || currentCustomer.email || '';
                            navigateTo('track');
                            if (window.history && window.history.replaceState) {
                              const newUrl = `${window.location.pathname}?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`;
                              window.history.replaceState({}, '', newUrl);
                            }
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5 text-slate-600" />
                          <span>Track</span>
                        </button>
                      </div>
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
                className="bg-sky-500 text-white font-bold px-5 py-2 rounded-full text-xs shadow-md cursor-pointer"
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
                    onClick={() => navigateTo('product', { productId: item.productId || item.id })}
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-black text-lg text-slate-900">
                    Order #{selectedOrder.orderId || selectedOrder.id}
                  </h3>
                  <span
                    className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      selectedOrder.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-700'
                        : selectedOrder.status === 'Cancelled'
                        ? 'bg-rose-100 text-rose-700'
                        : selectedOrder.status === 'Return Requested' || selectedOrder.status === 'Returned'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {selectedOrder.status || 'Order Received'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Placed on {selectedOrder.date || 'Recent'}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Stepper overview */}
              {(() => {
                const normStatus = normalizeStatus(selectedOrder.status);
                const stepIdx = getStepIndex(normStatus);
                const isSpecial = ['Cancelled', 'Returned', 'Return Requested'].includes(selectedOrder.status);

                if (isSpecial) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="font-bold">Status: {selectedOrder.status}</p>
                        {selectedOrder.returnReason && (
                          <p className="text-[11px] text-amber-800">Reason: {selectedOrder.returnReason}</p>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Delivery Progress
                    </p>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {STATUS_STEPS.map((s, idx) => {
                        const done = idx <= stepIdx;
                        const current = idx === stepIdx;
                        const SIcon = s.icon;
                        return (
                          <div key={s.key} className="flex flex-col items-center gap-1">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                current
                                  ? 'bg-sky-500 text-white ring-2 ring-sky-200'
                                  : done
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              <SIcon className="w-3.5 h-3.5" />
                            </div>
                            <span
                              className={`text-[9px] font-bold truncate max-w-full ${
                                current ? 'text-sky-600 font-extrabold' : done ? 'text-slate-700' : 'text-slate-400'
                              }`}
                            >
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                  Itemized Price Snapshot ({(selectedOrder.items || []).length})
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {(selectedOrder.items || []).map((item, idx) => {
                    const price = Number(item.priceAtPurchase || item.price || 0);
                    const qty = Number(item.quantity || 1);
                    const lineTotal = Number(item.lineTotal || price * qty);

                    return (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-white">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-contain rounded-lg border border-slate-100 bg-slate-50 p-1 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {qty} × ₹{price.toLocaleString('en-IN')} (Snapshot at purchase)
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

              {/* Grid: Delivery & Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 border border-slate-100">
                  <h5 className="font-bold uppercase tracking-wider text-[10px] text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    <span>Delivery Address</span>
                  </h5>
                  <p className="font-bold text-slate-800">{selectedOrder.customer?.name || 'Customer'}</p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {selectedOrder.customer?.address || 'Address on file'}<br />
                    {[selectedOrder.customer?.city, selectedOrder.customer?.state].filter(Boolean).join(', ')}{selectedOrder.customer?.pincode ? ` - ${selectedOrder.customer.pincode}` : ''}
                  </p>
                  {selectedOrder.customer?.phone && (
                    <p className="text-slate-600 text-[11px] pt-1">
                      Phone: <strong className="text-slate-800">+91 {selectedOrder.customer.phone}</strong>
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl space-y-1 border border-slate-100">
                  <h5 className="font-bold uppercase tracking-wider text-[10px] text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                    <span>Payment Summary</span>
                  </h5>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{Number(selectedOrder.subtotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Delivery:</span>
                    <span className="font-semibold text-slate-800">
                      {Number(selectedOrder.delivery) === 0 ? 'FREE' : `₹${Number(selectedOrder.delivery)}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900 text-xs">
                    <span>Total:</span>
                    <span className="text-sky-600">
                      ₹{Number(selectedOrder.total || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1">
                    Method: {selectedOrder.paymentMethod || 'Razorpay'} • Status: {selectedOrder.paymentStatus || 'Paid'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <a
                href={`https://wa.me/919993617796?text=Hi%2C%20I%20have%20a%20question%20about%20Order%20%23${selectedOrder.orderId || selectedOrder.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp Help</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const orderId = selectedOrder.orderId || selectedOrder.id;
                    const email = selectedOrder.customer?.email || currentCustomer.email || '';
                    setSelectedOrder(null);
                    navigateTo('track');
                    if (window.history && window.history.replaceState) {
                      const newUrl = `${window.location.pathname}?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`;
                      window.history.replaceState({}, '', newUrl);
                    }
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Open Tracking Page</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
