import React from 'react';
import { useShop } from '../context/ShopContext';
import { ShieldCheck, ArrowLeft, Lock, Eye, KeyRound } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Privacy & Trust
          </span>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            Privacy Policy
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
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            1. Information We Collect
          </h2>
          <p>
            When you interact with Gargee Medicose to order pet care products, we may collect the following details:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Contact details such as your full name, phone number, and email address.</li>
            <li>Delivery address across India with pincode.</li>
            <li>Order history, items purchased, and transaction references for online payment confirmation.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            2. How We Use Your Information
          </h2>
          <p>
            Your information is strictly used for fulfilling your orders:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Processing, packing, and delivering your ordered pet food and medicine.</li>
            <li>Providing order tracking updates via WhatsApp or SMS.</li>
            <li>Customer service and communication regarding order inquiries.</li>
            <li>Protecting against fraud and ensuring secure transactions.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            3. Payment Security & Data Handling
          </h2>
          <p>
            We process all online transactions through secure UPI and verified payment interfaces. We <strong>never store or record credit/debit card numbers or bank account PINs</strong> on our servers. All account authentication is managed securely via Google Firebase Authentication.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            4. Third-Party Sharing
          </h2>
          <p>
            We respect your privacy. We do not sell, trade, or rent your personal contact information to third-party marketing companies. Data is only shared with verified delivery personnel for the sole purpose of dropping off your order at your address.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            5. Contact Information
          </h2>
          <p>
            If you have questions about our privacy practices, wish to update your details, or request deletion of your account, please reach out to us at <strong>{businessInfo.email || 'mahantpal123@gmail.com'}</strong> or through our Customer Care Support on WhatsApp.
          </p>
        </section>
      </div>
    </div>
  );
}
