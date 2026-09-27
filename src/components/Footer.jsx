import React from 'react';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/mockData';
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Truck,
  HeartHandshake,
  ArrowRight,
  PawPrint,
  Camera,
  RotateCcw,
  MessageSquare
} from 'lucide-react';

export default function Footer() {
  const { navigateTo, businessInfo } = useShop();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mb-12 border-b border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">100% Genuine Pet Care</h4>
              <p className="text-xs text-slate-400">Authentic brands, verified vet medicines & fresh stock.</p>
            </div>
          </div>

          <a
            href={businessInfo.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 justify-center md:justify-start hover:opacity-90 transition group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Customer Care Support</h4>
              <p className="text-xs text-slate-400">Instant assistance & order support on WhatsApp.</p>
            </div>
          </a>

          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Pan India Delivery</h4>
              <p className="text-xs text-slate-400">Fast doorstep delivery across India. Free shipping above ₹1,000.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Retail & Wholesale</h4>
              <p className="text-xs text-slate-400">Bulk supply for breeders, pet shops & clinics with best rates.</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {}
        <div className="lg:col-span-2 space-y-4">
          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-sky-500 p-0.5 shadow-md shadow-sky-500/20">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1">
                <img
                  src="/logo.png"
                  alt="Gargee Medicose Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/favicon.svg";
                  }}
                />
              </div>
            </div>
            <div>
              <span className="block font-heading text-xl font-black tracking-tight text-white">
                Gargee <span className="text-sky-400">Medicose</span>
              </span>
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {businessInfo.tagline}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            Your trusted destination for pet food, accessories, medicines and everyday pet care essentials across India. Serving pet parents with love and dedication.
          </p>

          {}
          <div className="flex items-center gap-3 pt-2">
            <a
              href={businessInfo.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-pink-600 hover:text-white flex items-center justify-center text-slate-300 transition duration-200"
              aria-label="Instagram"
            >
              <Camera className="w-5 h-5" />
            </a>
            <a
              href={businessInfo.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center text-slate-300 transition duration-200"
              aria-label="WhatsApp"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>

        {}
        <div>
          <h5 className="font-heading font-bold text-white text-base mb-4 tracking-wide uppercase text-xs text-sky-400">
            Shop Categories
          </h5>
          <ul className="space-y-2.5 text-sm">
            {CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => navigateTo('shop', { category: cat.id })}
                  className="hover:text-sky-400 transition flex items-center gap-1.5 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-sky-400 transition"></span>
                  <span>{cat.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {}
        <div>
          <h5 className="font-heading font-bold text-white text-base mb-4 tracking-wide uppercase text-xs text-sky-400">
            Quick Links
          </h5>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button
                onClick={() => navigateTo('home')}
                className="hover:text-sky-400 transition"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('shop')}
                className="hover:text-sky-400 transition"
              >
                All Products
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('about')}
                className="hover:text-sky-400 transition"
              >
                About Us
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('cart')}
                className="hover:text-sky-400 transition"
              >
                Shopping Cart
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('track')}
                className="hover:text-sky-400 transition flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <span>Track Your Order</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('contact')}
                className="hover:text-sky-400 transition"
              >
                Contact Us
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('terms')}
                className="hover:text-sky-400 transition"
              >
                Terms & Conditions
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('privacy')}
                className="hover:text-sky-400 transition"
              >
                Privacy Policy
              </button>
            </li>
          </ul>
        </div>

        {}
        <div>
          <h5 className="font-heading font-bold text-white text-base mb-4 tracking-wide uppercase text-xs text-sky-400">
            Get in Touch
          </h5>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <a
                href={businessInfo.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="text-white hover:text-emerald-400 font-semibold"
              >
                WhatsApp Support
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Camera className="w-4 h-4 text-sky-400 shrink-0" />
              <a
                href={businessInfo.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-400"
              >
                {businessInfo.instagram}
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-sky-400 shrink-0" />
              <a
                href={`mailto:${businessInfo.email}`}
                className="hover:text-sky-400"
              >
                {businessInfo.email}
              </a>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <p
            onClick={(e) => {
              if (e.detail === 3) {
                navigateTo('admin');
              }
            }}
            className="cursor-default select-none"
          >
            © 2026 Gargee Medicose. All Rights Reserved.
          </p>
          <button
            onClick={() => navigateTo('admin')}
            className="text-slate-700 hover:text-slate-400 text-[10px] transition p-1"
            title="Admin Login Portal"
            aria-label="Admin Portal"
          >
            🔒 Admin Access
          </button>
        </div>
        <p className="flex items-center gap-1 justify-center">
          Dedicated to your pet’s health & happiness across India.
        </p>
      </div>
    </footer>
  );
}
