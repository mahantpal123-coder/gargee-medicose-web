import React from 'react';
import { useShop } from '../context/ShopContext';
import { ShieldCheck, ArrowLeft, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TermsPage() {
  const { navigateTo, businessInfo } = useShop();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {}
      <div>
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 transition bg-white px-4 py-2 rounded-full border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      {}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
            Legal Information
          </span>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            Terms & Conditions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Last Updated: August 2026 • Gargee Medicose
          </p>
        </div>
      </div>

      {}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            1. Overview & Agreement
          </h2>
          <p>
            Welcome to <strong>Gargee Medicose</strong>. By accessing our website, browsing our pet catalog, or placing an order, you agree to be bound by the terms and conditions set forth herein. If you do not agree with any portion of these terms, please refrain from using our online ordering services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            2. Product Information & Pricing
          </h2>
          <p>
            We take utmost care to ensure all pet foods, accessories, veterinary medicines, and nutritional supplements displayed on our store have accurate pricing, descriptions, and stock availability. All prices are in Indian Rupees (₹) and include applicable taxes. We reserve the right to modify prices or discontinue items without prior notice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            3. Online Payment Policy (No Cash on Delivery)
          </h2>
          <p>
            To ensure swift processing and zero contact friction, <strong>Gargee Medicose strictly operates on 100% prepaid online payment</strong>. We accept payments via UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking, and scanned QR code transfer. <strong>Cash on Delivery (COD) is not accepted</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            4. Delivery Terms
          </h2>
          <p>
            We offer prompt doorstep delivery across India. Free delivery applies to qualifying order amounts (₹1,000 and above). Orders are typically dispatched within 2 to 24 hours of payment verification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            5. Contact & Support
          </h2>
          <p>
            For inquiries regarding our terms, order tracking, or bulk queries, reach out to our Customer Care Support on WhatsApp or via email at <strong>{businessInfo.email || 'mahantpal123@gmail.com'}</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
