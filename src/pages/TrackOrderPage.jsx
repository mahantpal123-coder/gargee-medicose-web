import React, { useState, useEffect, useCallback } from 'react';
import { useShop } from '../context/ShopContext';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  CreditCard,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Phone,
  RotateCcw,
  XCircle,
  Copy,
  Zap
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

export default function TrackOrderPage() {
  const { navigateTo, businessInfo } = useShop();

  const [orderIdInput, setOrderIdInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [liveTracking, setLiveTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);

  // Auto-search if query parameters are present in URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlOrderId = params.get('orderId');
      const urlEmail = params.get('email');
      if (urlOrderId && urlEmail) {
        setOrderIdInput(urlOrderId);
        setEmailInput(urlEmail);
        performTrack(urlOrderId, urlEmail);
      }
    } catch {
      // ignore URL parsing errors
    }
  }, []);

  const performTrack = async (orderId, email) => {
    setErrorMsg('');
    setLoading(true);

    try {
      const resp = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId.trim(),
          email: email.trim()
        })
      });

      const data = await resp.json();

      if (resp.ok && data.success && data.order) {
        setOrderData(data.order);
      } else {
        setOrderData(null);
        setErrorMsg(
          data.error || 'No matching order found for this Order ID and Email address. Please verify your details.'
        );
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setErrorMsg('Unable to retrieve tracking information. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!orderIdInput.trim() || !emailInput.trim()) {
      setErrorMsg('Please enter both your Order ID and Checkout Email address.');
      return;
    }
    performTrack(orderIdInput, emailInput);
  };

  const fetchLiveTracking = useCallback(async (orderId) => {
    if (!orderId) return;
    setTrackingLoading(true);
    try {
      const resp = await fetch(`/api/shiprocket/track?orderId=${encodeURIComponent(orderId)}`);
      const data = await resp.json();
      if (data.success && data.tracking) {
        setLiveTracking(data.tracking);
      }
    } catch (e) {
      // Silently fail - live tracking is optional
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  // Fetch live tracking when order data loads with AWB
  useEffect(() => {
    if (orderData?.awbCode) {
      fetchLiveTracking(orderData.orderId);
    }
  }, [orderData?.awbCode, orderData?.orderId, fetchLiveTracking]);

  const handleCopyAwb = () => {
    if (navigator.clipboard && orderData?.awbCode) {
      navigator.clipboard.writeText(orderData.awbCode);
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    }
  };

  const currentNormalizedStatus = orderData ? normalizeStatus(orderData.status) : 'Order Received';
  const currentStepIndex = getStepIndex(currentNormalizedStatus);
  const isSpecialStatus = ['Cancelled', 'Returned', 'Return Requested'].includes(orderData?.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 inline-block">
          Order Tracking
        </span>
        <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-slate-900">
          Track Your Delivery
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Enter your Order ID and Email address used at checkout to see real-time updates.
        </p>
      </div>

      {/* Tracking Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
        <form onSubmit={handleTrackSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Order ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GM-104159"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address Used at Checkout
              </label>
              <input
                type="email"
                required
                placeholder="e.g. yourname@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-full text-xs transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Order Status Results */}
      {orderData && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg sm:text-xl font-black text-slate-900">
                  Order #{orderData.orderId}
                </h2>
                <span
                  className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                    orderData.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-700'
                      : orderData.status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : orderData.status === 'Return Requested' || orderData.status === 'Returned'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {orderData.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Placed on: {orderData.date}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 block">Total Amount</span>
              <span className="font-heading font-black text-lg text-slate-900 text-sky-600">
                ₹{Number(orderData.total || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Special Status banner (Cancelled / Returned) */}
          {isSpecialStatus && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Status: {orderData.status}</p>
                {orderData.returnReason && (
                  <p className="text-[11px] text-amber-800 mt-0.5">Reason: {orderData.returnReason}</p>
                )}
              </div>
            </div>
          )}

          {/* Local Instant Delivery Banner */}
          {orderData.courierName === 'Local Instant Delivery' && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-slate-900 text-xs">Local Instant Delivery</h4>
              </div>
              <p className="text-[11px] text-slate-600">
                Your order is routed for <strong>same-day doorstep delivery</strong> in your city. Our delivery partner will reach you shortly.
              </p>
            </div>
          )}

          {/* Shiprocket Live Tracking Card */}
          {orderData.awbCode && (
            <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-600" />
                  Live Shipping Tracking
                </h4>
                {trackingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500">Courier:</span>
                  <span className="text-[11px] font-black text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                    {orderData.courierName || 'Assigned'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500">AWB:</span>
                  <span className="font-mono font-bold text-[11px] text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                    {orderData.awbCode}
                  </span>
                  <button
                    onClick={handleCopyAwb}
                    className="p-1 text-slate-400 hover:text-sky-600 rounded transition"
                    title="Copy AWB"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {copiedAwb && <span className="text-[10px] font-bold text-emerald-600">Copied!</span>}
                </div>
              </div>

              {/* Live tracking timeline */}
              {liveTracking && (
                <div className="space-y-2">
                  {liveTracking.currentStatus && (
                    <div className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-sky-100">
                      <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-slate-800">{liveTracking.currentStatus}</span>
                    </div>
                  )}
                  {liveTracking.etd && (
                    <p className="text-[11px] text-slate-500">
                      Expected Delivery: <strong className="text-slate-700">{liveTracking.etd}</strong>
                    </p>
                  )}
                  {Array.isArray(liveTracking.scans) && liveTracking.scans.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {liveTracking.scans.slice(0, 5).map((scan, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 bg-white/60 rounded-lg p-2 border border-slate-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0"></div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-700">{scan.activity || scan.status || 'In Transit'}</p>
                            {(scan.scan_type || scan.location) && (
                              <p className="text-[10px] text-slate-400">{scan.scan_type || ''} {scan.location || ''}</p>
                            )}
                            {scan.scanned_at && (
                              <p className="text-[10px] text-slate-400">{new Date(scan.scanned_at).toLocaleString('en-IN')}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {orderData.awbCode && !trackingLoading && !liveTracking?.currentStatus && (
                <p className="text-[11px] text-slate-500">
                  Tracking will update once the courier picks up your package. You can also track directly:
                </p>
              )}

              {orderData.awbCode && (
                <a
                  href={`https://www.shiprocket.in/shipment-tracking/?awb=${orderData.awbCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-800 underline"
                >
                  <span>Track on Shiprocket</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Status Progression Stepper */}
          {!isSpecialStatus && (
            <div className="py-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                Delivery Progression
              </h3>

              <div className="relative">
                {/* Horizontal line on tablet/desktop */}
                <div className="hidden sm:block absolute top-5 left-10 right-10 h-1 bg-slate-100 rounded-full" />
                <div
                  className="hidden sm:block absolute top-5 left-10 h-1 bg-sky-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (currentStepIndex / (STATUS_STEPS.length - 1)) * 80)}%`
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            isCurrent
                              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 ring-4 ring-sky-100'
                              : isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isCurrent ? 'text-sky-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] text-sky-500 font-extrabold uppercase tracking-wider block sm:inline">
                              • Current Stage
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Ordered items details */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ordered Items ({(orderData.items || []).length})
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {(orderData.items || []).map((item, idx) => {
                const purchasePrice = Number(item.priceAtPurchase || item.price || 0);
                const quantity = Number(item.quantity || 1);
                const lineTotal = Number(item.lineTotal || purchasePrice * quantity);

                return (
                  <div key={idx} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-contain rounded-lg border border-slate-100 bg-slate-50 p-1 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Quantity: <strong className="text-slate-700">{quantity}</strong> × ₹{purchasePrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary & Delivery Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            {/* Delivery address */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Delivery Address</span>
              </h4>
              <p className="font-bold text-slate-800">{orderData.customer?.name || 'Customer'}</p>
              <p className="text-slate-600 leading-relaxed">
                {orderData.customer?.address || 'Address on file'}<br />
                {[orderData.customer?.city, orderData.customer?.state].filter(Boolean).join(', ')}{orderData.customer?.pincode ? ` - ${orderData.customer.pincode}` : ''}
              </p>
              {orderData.customer?.phone && (
                <p className="text-slate-600 pt-1">
                  Contact: <span className="font-semibold text-slate-800">+91 {orderData.customer.phone}</span>
                </p>
              )}
            </div>

            {/* Payment & Charges */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                <span>Payment Summary</span>
              </h4>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{Number(orderData.subtotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges:</span>
                  <span className="font-semibold text-slate-800">
                    {Number(orderData.delivery) === 0 ? 'FREE' : `₹${Number(orderData.delivery)}`}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900 text-sm">
                  <span>Total Paid:</span>
                  <span className="text-sky-600">
                    ₹{Number(orderData.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Mode: <strong className="text-slate-700">{orderData.paymentMethod || 'Razorpay'}</strong> • Status: <strong className="text-emerald-700">{orderData.paymentStatus || 'Paid'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Need help footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100">
            <p className="text-slate-500 text-center sm:text-left">
              Questions regarding this order? Our support team is ready on WhatsApp.
            </p>
            <a
              href={`https://wa.me/919993617796?text=Hi%2C%20I%20need%20assistance%20with%20Order%20%23${orderData.orderId}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-full transition flex items-center gap-1.5 shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
