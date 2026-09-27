import React from 'react';
import { useShop } from '../context/ShopContext';
import {
  Store,
  ShieldCheck,
  Award,
  Heart,
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Mail
} from 'lucide-react';

export default function AboutPage() {
  const { navigateTo, businessInfo } = useShop();

  return (
    <div className="space-y-16 py-8">
      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 text-white rounded-3xl p-8 sm:p-14 text-center space-y-4 shadow-lg shadow-sky-500/20">
          <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3.5 py-1.5 rounded-full inline-block backdrop-blur-sm">
            About Us
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl font-black max-w-2xl mx-auto">
            Caring for Pets Across India with Love & Quality
          </h1>
          <p className="text-sm sm:text-base text-sky-100 max-w-xl mx-auto font-normal leading-relaxed">
            Gargee Medicose is your premier pet supply and veterinary medicine store, offering certified pet foods, accessories, supplements, and grooming essentials.
          </p>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative">
            <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80"
                alt="Happy veterinarian with dog"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-sky-100 hidden sm:flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading font-black text-slate-800 text-lg">Gargee Medicose</p>
                <p className="text-[11px] text-slate-500">Serving All Over India</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              Our Journey & Mission
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Everything Your Pet Needs, Under One Roof
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Gargee Medicose is a trusted pet care store offering pet food, accessories, medicines and everyday pet essentials across India. We focus on providing quality products for dogs, cats and other pets while making pet shopping simple and convenient.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              Whether you are an individual pet parent looking for high-protein kibble or a veterinary clinic / breeder requiring bulk wholesale supplies, we are equipped to support you with certified, authentic products at transparent prices.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Certified Pet Medicines</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Wholesale & Retail</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Genuine Brands</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Fast Local Delivery</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigateTo('shop')}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3.5 rounded-full text-xs transition shadow-md flex items-center gap-2"
              >
                <span>Browse Our Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              Get in Touch
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
              We're Here to Help
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Reach out to us on WhatsApp or email for any queries about pet products, orders, or wholesale inquiries. We deliver across all of India.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href={businessInfo.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-3 rounded-full transition"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp Us
              </a>
              <a
                href={`mailto:${businessInfo.email}`}
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold px-6 py-3 rounded-full transition"
              >
                <Mail className="w-4 h-4" />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-slate-50 py-16 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
              Why Pet Parents Trust Us
            </h3>
            <p className="text-xs text-slate-500">
              Four key pillars that define our service to pet parents
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-slate-800 text-base">Quality Products</h4>
              <p className="text-xs text-slate-500">Genuine, vetted nutrition and healthcare products from top global brands.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-slate-800 text-base">Wide Product Range</h4>
              <p className="text-xs text-slate-500">Food, accessories, medicines and everyday essentials all under one single roof.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-slate-800 text-base">Retail & Wholesale</h4>
              <p className="text-xs text-slate-500">Supplying single pet owners as well as clinics, breeders, and local retailers.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-slate-800 text-base">Trusted Local Store</h4>
              <p className="text-xs text-slate-500">Serving pet parents with reliable advice and prompt service.</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-3.5 py-1 rounded-full">
            Got Questions?
          </span>
          <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-3 pt-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
            <h4 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
              Do you deliver pet food and medicines across India?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Yes! We offer fast doorstep delivery across India. Orders above ₹999 qualify for free delivery.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
            <h4 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
              Are the veterinary medicines and supplements 100% genuine?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Absolutely. All our pharmaceutical products, dewormers, tick treatments, and nutritional supplements are sourced directly from authorized veterinary distributors like Himalaya, Virbac, Intas, and Beaphar.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
            <h4 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
              Can I place an order directly on WhatsApp?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Yes, you can order online through this website or click Customer Care Support to reach us directly on WhatsApp and send your required product list for instant confirmation.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
            <h4 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
              Do you supply pet foods and accessories in wholesale for clinics and breeders?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Yes, we cater to retail pet parents as well as bulk wholesale requirements for breeders, rescue shelters, and pet clinics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
