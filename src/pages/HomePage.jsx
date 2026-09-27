import React, { useRef } from 'react';
import { useShop } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import {
  ArrowRight,
  ShieldCheck,
  Package,
  Store,
  Truck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Award,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

export default function HomePage() {
  const { navigateTo, products, categories, businessInfo } = useShop();
  const carouselRef = useRef(null);

  const bestSellers = products.filter((p) => p.isBestSeller && p.inStock).length > 0
    ? products.filter((p) => p.isBestSeller && p.inStock)
    : products.filter((p) => p.inStock !== false);
  const featuredProducts = products.filter((p) => p.inStock !== false).slice(0, 12);

  return (
    <div className="space-y-8 sm:space-y-12 pb-12">
      <HeroSlider />

      {}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-slate-900">
            Shop by Category
          </h2>
          <button
            onClick={() => navigateTo('shop')}
            className="text-xs font-bold text-sky-600 hover:underline"
          >
            See All
          </button>
        </div>

        {}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigateTo('shop', { category: cat.id })}
              className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs hover:shadow-md cursor-pointer transition active:scale-95 flex flex-col items-center justify-between text-center h-[210px] sm:h-[200px]"
            >
              <div className="w-28 h-28 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-sky-50/70 p-1 flex items-center justify-center shrink-0 border border-sky-100/60">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                />
              </div>

              <div>
                <h3 className="font-heading font-extrabold text-slate-900 text-sm sm:text-sm">
                  {cat.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 mt-auto bg-sky-50 px-3 py-1 rounded-full w-full justify-center">
                <span>Shop</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-slate-900">
              Best Sellers
            </h2>
            <p className="text-[12px] text-slate-500">
              Top picks for dogs and cats across India
            </p>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="text-xs font-bold text-sky-600 hover:underline"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
        {}
        <div
          onClick={() => navigateTo('shop', { category: 'dog-food' })}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-sky-600 to-sky-500 text-white p-5 sm:p-6 flex items-center justify-between cursor-pointer active:scale-99 transition shadow-xs"
        >
          <div className="space-y-1 z-10 max-w-[65%]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block">
              Nutrition First
            </span>
            <h3 className="font-heading text-lg sm:text-2xl font-bold leading-tight">
              Premium Pet Food
            </h3>
            <p className="text-xs text-sky-100">
              Healthy nutrition for happier pets.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white pt-1">
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden shadow-md bg-white/10 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80"
              alt="Pet Food"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {}
        <div
          onClick={() => navigateTo('shop', { category: 'accessories' })}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-600 to-purple-500 text-white p-5 sm:p-6 flex items-center justify-between cursor-pointer active:scale-99 transition shadow-xs"
        >
          <div className="space-y-1 z-10 max-w-[65%]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block">
              Comfort & Gear
            </span>
            <h3 className="font-heading text-lg sm:text-2xl font-bold leading-tight">
              Pet Accessories
            </h3>
            <p className="text-xs text-purple-100">
              Everything your pet needs for walks & play.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white pt-1">
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden shadow-md bg-white/10 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=400&q=80"
              alt="Accessories"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {}
        <div
          onClick={() => navigateTo('shop', { category: 'medicines' })}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-5 sm:p-6 flex items-center justify-between cursor-pointer active:scale-99 transition shadow-xs"
        >
          <div className="space-y-1 z-10 max-w-[65%]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block">
              Health & Wellness
            </span>
            <h3 className="font-heading text-lg sm:text-2xl font-bold leading-tight">
              Pet Care & Medicines
            </h3>
            <p className="text-xs text-emerald-100">
              Trusted products for everyday pet care.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white pt-1">
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden shadow-md bg-white/10 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80"
              alt="Medicines"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-slate-900">
              Featured Products
            </h2>
            <p className="text-[12px] text-slate-500">
              Handpicked everyday favorites
            </p>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="text-xs font-bold text-sky-600 hover:underline"
          >
            See All
          </button>
        </div>

        {}
        <div
          ref={carouselRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-none no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="w-[170px] sm:w-[220px] md:w-[260px] snap-start shrink-0"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-slate-900">
              Pet Health & Feeding Guides
            </h2>
            <p className="text-[12px] text-slate-500">
              Expert advice curated by veterinary pharmacists
            </p>
          </div>
          <button
            onClick={() => navigateTo('about')}
            className="text-xs font-bold text-sky-600 hover:underline"
          >
            Learn More
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full inline-block">
                Health & Vet Care
              </span>
              <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
                Essential Deworming Schedule
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Learn why timely deworming protects against anemia and keeps pups active and healthy.
              </p>
            </div>
            <button
              onClick={() => navigateTo('shop', { category: 'medicines' })}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 pt-2"
            >
              <span>View Dewormers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full inline-block">
                Grooming & Protection
              </span>
              <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
                Tick & Flea Prevention Guide
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Protect your dogs and cats from ticks and fleas with safe medicated shampoos and sprays.
              </p>
            </div>
            <button
              onClick={() => navigateTo('shop', { category: 'grooming' })}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 pt-2"
            >
              <span>View Grooming Essentials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full inline-block">
                Puppy & Kitten Starter
              </span>
              <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
                Smooth Weaning & Growth
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                How to smoothly transition newborn pups from mother's milk to starter kibble and calcium formulas.
              </p>
            </div>
            <button
              onClick={() => navigateTo('shop', { category: 'puppy-care' })}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 pt-2"
            >
              <span>View Starter Nutrition</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-1 mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full inline-block">
            Pet Parent Reviews
          </span>
          <h2 className="font-heading text-[20px] sm:text-[24px] font-bold text-slate-900">
            Loved by Pet Lovers Across India
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
            <div className="flex text-amber-400 text-xs">★★★★★</div>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              "Gargee Medicose is the only store where I get genuine Royal Canin Maxi and vet-prescribed liver tonics all in one place. Excellent service!"
            </p>
            <div className="border-t border-slate-100 pt-2 text-xs">
              <p className="font-bold text-slate-900">Dr. Rajesh Agrawal</p>
              <p className="text-[11px] text-slate-400">Happy Customer</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
            <div className="flex text-amber-400 text-xs">★★★★★</div>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              "The staff is very polite and always guides on the correct food for sensitive pets. The direct WhatsApp order feature is super fast!"
            </p>
            <div className="border-t border-slate-100 pt-2 text-xs">
              <p className="font-bold text-slate-900">Sneha Dewangan</p>
              <p className="text-[11px] text-slate-400">Verified Buyer</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
            <div className="flex text-amber-400 text-xs">★★★★★</div>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              "Best prices on Whiskas cat food and Me-O treats. Very convenient ordering online and fresh stock every time."
            </p>
            <div className="border-t border-slate-100 pt-2 text-xs">
              <p className="font-bold text-slate-900">Amitabh Sen</p>
              <p className="text-[11px] text-slate-400">Pet Parent</p>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="bg-sky-50/50 py-8 border-y border-sky-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-slate-900">
              Why Choose Gargee Medicose
            </h2>
            <p className="text-xs text-slate-500">
              Serving pet parents across India with care & trust
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1 text-center">
              <ShieldCheck className="w-6 h-6 text-sky-500 mx-auto" />
              <h4 className="font-heading font-bold text-slate-800 text-xs sm:text-sm">Quality Products</h4>
              <p className="text-[11px] text-slate-400">Genuine & carefully selected.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1 text-center">
              <Package className="w-6 h-6 text-purple-500 mx-auto" />
              <h4 className="font-heading font-bold text-slate-800 text-xs sm:text-sm">Wide Range</h4>
              <p className="text-[11px] text-slate-400">Food, medicines & accessories.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1 text-center">
              <Store className="w-6 h-6 text-emerald-500 mx-auto" />
              <h4 className="font-heading font-bold text-slate-800 text-xs sm:text-sm">Retail & Wholesale</h4>
              <p className="text-[11px] text-slate-400">For pet owners and clinics.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1 text-center">
              <Truck className="w-6 h-6 text-amber-500 mx-auto" />
              <h4 className="font-heading font-bold text-slate-800 text-xs sm:text-sm">Trusted Store</h4>
              <p className="text-[11px] text-slate-400">Serving pet parents daily.</p>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 bg-white/10 px-2.5 py-1 rounded-full inline-block">
                Contact Us
              </span>
              <h2 className="font-heading text-xl sm:text-3xl font-black">
                Need Help Choosing the Right Product?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Talk directly with our store team for personalized advice on dog breeds, vet medicines, tick treatments, and weaning formulas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`tel:${businessInfo.phone}`}
                className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-6 py-3 rounded-full flex items-center gap-2 transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Store</span>
              </a>
              <a
                href={businessInfo.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-6 py-3 rounded-full flex items-center gap-2 transition"
              >
                <span>WhatsApp Chat</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
