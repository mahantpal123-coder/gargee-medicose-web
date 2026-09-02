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

    
    try {
      fetch('https://formsubmit.co/ajax/mahantpal123@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          _subject: `📩 New Customer Inquiry from ${formData.name} (${formData.phone})`,
          _template: 'table',
          _captcha: 'false',
          'Customer Name': formData.name,
          'Phone Number': formData.phone,
          'Pet / Query Type': formData.petType,
          'Message / Requirement': formData.message,
          'Date & Time': new Date().toLocaleString('en-IN')
        })
      }).catch((err) => console.warn('Inquiry email fallback:', err));
    } catch (e) {
      console.warn(e);
    }

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
          Visit our store in Bilaspur or connect with us directly for product queries, medicine guidance, and wholesale supply.
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
                <p className="text-sky-600 font-semibold">{businessInfo.city || 'Bilaspur'}, {businessInfo.state || 'Chhattisgarh'} - {businessInfo.pincode || '495001'}</p>
              </div>
            </div>

            {}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-800 text-sm">Call & WhatsApp Support</p>
                <p className="text-slate-600 font-bold text-base text-slate-900">
                  {businessInfo.phoneFormatted}
                </p>
                <div className="flex gap-2 pt-1">
                  <a
                    href={`tel:${businessInfo.phone}`}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-1.5 rounded-full text-[11px] transition inline-block"
                  >
                    Call Now
                  </a>
                  <a
                    href={businessInfo.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-full text-[11px] transition inline-block"
                  >
                    WhatsApp
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

            {}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-800 text-sm">Store Hours</p>
                <p className="text-slate-600">Monday - Sunday: <strong>9:30 AM – 9:30 PM</strong></p>
                <p className="text-emerald-600 font-semibold">Open 7 Days a Week</p>
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

      {}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-lg">
              Find Our Store on Map
            </h3>
            <p className="text-xs text-slate-500">
              Shop 4, Opposite Shyam Mandir, Juna Bilaspur Road, Shanichari Bazar, Bilaspur
            </p>
          </div>

          <a
            href="https://maps.app.goo.gl/SuMHgqCWg9aWHGGd7"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 px-4 py-2 rounded-full"
          >
            <MapPin className="w-4 h-4" />
            <span>Open in Google Maps</span>
          </a>
        </div>

        <div className="w-full h-80 sm:h-[400px] rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-50">
          {businessInfo.mapEmbedUrl ? (
            <iframe
              title="Gargee Medicose Location"
              src={businessInfo.mapEmbedUrl}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          ) : (
            <iframe
              title="Gargee Medicose Location"
              src="https://maps.google.com/maps?q=Bilaspur,Chhattisgarh&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          )}
        </div>
      </div>
    </div>
  );
}
