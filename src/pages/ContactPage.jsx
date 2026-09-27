import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  MapPin,
  Phone,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  Share2,
  Camera,
  Loader2
} from 'lucide-react';

export default function ContactPage() {
  const { showToast, addInquiry, businessInfo } = useShop();
  const [formSent, setFormSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    petType: 'Dog',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setIsSubmitting(true);

    
    addInquiry({
      name: formData.name,
      phone: formData.phone,
      petType: formData.petType,
      message: formData.message
    });

    // Send inquiry notification via backend SMTP
    fetch('/api/send-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        petType: formData.petType,
        message: formData.message
      })
    }).catch(() => {});

    setIsSubmitting(false);
    setFormSent(true);
    showToast("Inquiry saved! We'll get back to you shortly.");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {}
      <div className="bg-gradient-to-r from-sky-50 via-sky-100 to-indigo-50 p-8 sm:p-12 rounded-3xl border border-sky-100 text-center space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-white px-3 py-1 rounded-full shadow-xs">
          Get in Touch
        </span>
        <h1 className="font-heading text-2xl sm:text-4xl font-black text-slate-900">
          Contact Gargee Medicose
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Connect with us directly for product queries, medicine guidance, and wholesale supply. We deliver across India.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {}
        <div className="lg:col-span-5 space-y-6">
          {}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-heading font-bold text-slate-900 text-lg border-b pb-4">
              Store Information
            </h3>

            {}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-800 text-sm">{businessInfo.name || 'Gargee Medicose'}</p>
                <p className="text-slate-600 leading-relaxed">
                  {businessInfo.address}
                </p>
                <p className="text-sky-600 font-semibold">Pan India Delivery</p>
              </div>
            </div>

            {}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-800 text-sm">Customer Care Support</p>
                <p className="text-slate-500 text-xs">
                  Instant assistance & orders via WhatsApp
                </p>
                <div className="pt-1">
                  <a
                    href={businessInfo.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-full text-xs transition inline-flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Customer Care Support</span>
                  </a>
                </div>
              </div>
            </div>

            {}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-800 text-sm">Instagram Handle</p>
                <a
                  href={businessInfo.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-pink-600 hover:underline font-bold text-sm block"
                >
                  {businessInfo.instagram}
                </a>
                <p className="text-[11px] text-slate-400">Follow us for updates, arrivals & pet health tips</p>
              </div>
            </div>

          </div>
        </div>

        {}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-heading font-bold text-slate-900 text-lg">
              Send Us a Message / Inquiry
            </h3>

            {formSent ? (
              <div className="bg-emerald-50 rounded-2xl p-8 text-center space-y-4 border border-emerald-100">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-heading font-bold text-slate-800 text-base">
                  Inquiry Received!
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Thank you for reaching out to Gargee Medicose. Your inquiry has been sent to our team and logged into our management desk. We will contact you on <strong>+91 {formData.phone}</strong>.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <a
                    href={businessInfo.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-full inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Chat Directly on WhatsApp</span>
                  </a>
                  <button
                    onClick={() => {
                      setFormSent(false);
                      setFormData({ name: '', phone: '', petType: 'Dog', message: '' });
                    }}
                    className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-full"
                  >
                    Send Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ankit Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Pet Type / Category</label>
                  <select
                    value={formData.petType}
                    onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Dog">Dog Food & Supplies</option>
                    <option value="Cat">Cat Food & Supplies</option>
                    <option value="Medicine">Veterinary Medicines & Tonics</option>
                    <option value="Wholesale">Wholesale / Bulk Order Inquiry</option>
                    <option value="Other">Other Pet Supplies</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Your Message or Required Product</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Tell us what product you are looking for or any questions..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-6 rounded-full text-xs transition shadow-md shadow-sky-500/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
