import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/mockData';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Phone,
  MessageSquare,
  Clock,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Pill,
  Dog,
  Cat,
  ShieldCheck,
  Package,
  Layers,
  Info,
  MapPin,
  Flame,
  Award,
  ShoppingBag,
  Tag,
  Truck
} from 'lucide-react';

export default function Header() {
  const {
    currentPage,
    currentCustomer,
    navigateTo,
    cartCount,
    cartBadgeBump,
    wishlist,
    wishlistBadgeBump,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    businessInfo
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo('shop', { search: searchQuery.trim() });
      setSearchOpen(false);
    }
  };

  const handleCategoryClick = (catId) => {
    navigateTo('shop', { category: catId });
    setShopDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm">
      {}
      <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white text-xs sm:text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider shrink-0">
              PAN INDIA
            </span>
            <span className="truncate font-semibold">{businessInfo.announcement}</span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs font-semibold shrink-0">
            <a
              href={businessInfo.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:underline"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Customer Care Support</span>
            </a>
          </div>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20 gap-2 sm:gap-6">
          {}
          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-sky-500 p-0.5 shadow-md shadow-sky-500/20 shrink-0">
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
            <div className="flex flex-col">
              <span className="font-heading text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight block">
                Gargee <span className="text-sky-600 font-black">Medicose</span>
              </span>
              <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                Pet Food & Vet Care
              </span>
            </div>
          </div>

          {}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-2 relative items-center"
          >
            <input
              type="text"
              placeholder="Search dog food, cat food, medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 bg-slate-100/90 border border-slate-200 rounded-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-black px-4 py-1.5 rounded-full transition cursor-pointer shadow-xs"
            >
              Search
            </button>
          </form>

          {}
          <nav className="hidden lg:flex items-center space-x-1 text-sm font-extrabold text-slate-700">
            {}
            <button
              onClick={() => navigateTo('home')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer text-sm ${
                currentPage === 'home' ? 'text-sky-600 bg-sky-50 font-black shadow-2xs' : 'hover:text-sky-600 hover:bg-slate-100'
              }`}
            >
              Home
            </button>

            {}
            <button
              onClick={() => navigateTo('shop', { category: null })}
              className={`px-4 py-2 rounded-xl transition cursor-pointer text-sm ${
                currentPage === 'shop' ? 'text-sky-600 bg-sky-50 font-black shadow-2xs' : 'hover:text-sky-600 hover:bg-slate-100'
              }`}
            >
              Shop
            </button>

            {}
            <button
              onClick={() => navigateTo('about')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer text-sm ${
                currentPage === 'about' ? 'text-sky-600 bg-sky-50 font-black shadow-2xs' : 'hover:text-sky-600 hover:bg-slate-100'
              }`}
            >
              About
            </button>

            {}
            <button
              onClick={() => navigateTo('contact')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer text-sm ${
                currentPage === 'contact' ? 'text-sky-600 bg-sky-50 font-black shadow-2xs' : 'hover:text-sky-600 hover:bg-slate-100'
              }`}
            >
              Contact
            </button>

            <button
              onClick={() => navigateTo('track')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer text-sm flex items-center gap-1.5 ${
                currentPage === 'track' ? 'text-sky-600 bg-sky-50 font-black shadow-2xs' : 'hover:text-sky-600 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </button>
          </nav>

          {}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
              className="md:hidden p-3 text-slate-800 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded-2xl active:scale-95 transition flex items-center justify-center shadow-2xs cursor-pointer"
            >
              <Search className="w-6 h-6 text-slate-700" />
            </button>

            {}
            <button
              onClick={() => navigateTo(currentCustomer ? 'account' : 'login')}
              aria-label="User Account"
              className="hidden sm:flex p-2 sm:px-3.5 sm:py-2 text-slate-800 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 border border-slate-200/80 rounded-full transition items-center gap-1.5 cursor-pointer shadow-2xs font-bold text-xs sm:text-sm"
              title={currentCustomer ? `Account (${currentCustomer.name})` : "Sign In / Register"}
            >
              <User className={`w-5 h-5 ${currentCustomer ? 'text-sky-600' : 'text-slate-600'}`} />
              <span className="hidden sm:inline font-bold">
                {currentCustomer ? currentCustomer.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            {/* Saved Wishlist Button */}
            <button
              onClick={() => navigateTo('wishlist')}
              aria-label="Wishlist"
              className={`hidden sm:flex relative p-2.5 text-slate-700 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-full transition cursor-pointer ${
                wishlistBadgeBump ? 'scale-110 ring-2 ring-rose-300' : ''
              }`}
              title="Saved Items"
            >
              <Heart className={`w-5 h-5 transition-transform ${wishlistBadgeBump ? 'fill-rose-500 text-rose-500 scale-125' : ''}`} />
              {wishlist.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-xs font-black flex items-center justify-center shadow-xs transition-transform duration-200 ${
                  wishlistBadgeBump ? 'scale-125 bg-rose-600' : ''
                }`}>
                  {wishlist.length}
                </span>
              )}
            </button>

            {}
            <button
              onClick={() => navigateTo('cart')}
              className={`relative p-3 sm:px-4 sm:py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl sm:rounded-full flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md shadow-sky-500/20 font-bold text-sm shrink-0 ${
                cartBadgeBump ? 'cart-bump ring-2 ring-sky-300 ring-offset-2' : ''
              }`}
              aria-label="Cart"
            >
              <div className="relative flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  <span className={`absolute -top-2.5 -right-2.5 w-5 h-5 bg-amber-400 text-slate-950 rounded-full text-[11px] font-black flex items-center justify-center border-2 border-white shadow-xs ${
                    cartBadgeBump ? 'scale-125 bg-emerald-400' : ''
                  } transition-transform duration-200`}>
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-extrabold">Cart</span>
            </button>

            {}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-3 text-slate-800 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded-2xl active:scale-95 focus:outline-none transition cursor-pointer flex items-center justify-center shadow-2xs"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}
            </button>
          </div>
        </div>

        {}
        {searchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="md:hidden pb-3.5 pt-1 flex items-center gap-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search dog food, medicines, treats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-sky-300 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-5 h-5 text-sky-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="bg-sky-500 text-white text-sm font-black px-4.5 py-3 rounded-2xl shadow-xs"
            >
              Search
            </button>
          </form>
        )}
      </div>

      {}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-sky-100 px-4 py-5 space-y-2 shadow-xl max-h-[85vh] overflow-y-auto">
          {}
          <button
            onClick={() => {
              navigateTo(currentCustomer ? 'account' : 'login');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left p-4 rounded-2xl bg-sky-50 text-sky-900 font-bold text-base mb-3 flex items-center justify-between border border-sky-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {currentCustomer ? currentCustomer.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  {currentCustomer ? currentCustomer.name : 'Sign In / Register'}
                </p>
                <p className="text-xs text-slate-500 font-normal">
                  {currentCustomer ? (currentCustomer.email || currentCustomer.phone) : 'Manage orders & wishlist'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-sky-600" />
          </button>

          {}
          <div className="text-xs uppercase font-black text-slate-400 px-3 pt-2 tracking-wider">
            Quick Navigation
          </div>

          <button
            onClick={() => {
              navigateTo('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-5 py-4 rounded-2xl font-black text-lg transition ${
              currentPage === 'home' ? 'bg-sky-50 text-sky-600' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => {
              navigateTo('shop', { category: null });
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-5 py-4 rounded-2xl font-black text-lg flex items-center justify-between border transition ${
              currentPage === 'shop' && !selectedCategory
                ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/25'
                : 'bg-sky-50/90 text-sky-950 border-sky-200 hover:bg-sky-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-sky-600" />
              <span>All Products Catalog</span>
            </div>
            <ArrowRight className="w-5 h-5 opacity-70" />
          </button>

          {}
          <div className="text-xs uppercase font-black text-slate-400 px-3 pt-3 tracking-wider">
            Browse By Category ({CATEGORIES.length})
          </div>

          <div className="grid grid-cols-2 gap-2.5 py-1">
            <button
              onClick={() => handleCategoryClick('dog-food')}
              className="text-left p-4 rounded-2xl bg-amber-50/90 hover:bg-amber-100 text-amber-950 font-black text-base flex items-center gap-3 border border-amber-200/80 shadow-2xs active:scale-95 transition"
            >
              <Dog className="w-6 h-6 text-amber-600 shrink-0" />
              <span>Dog Food</span>
            </button>

            <button
              onClick={() => handleCategoryClick('cat-food')}
              className="text-left p-4 rounded-2xl bg-pink-50/90 hover:bg-pink-100 text-pink-950 font-black text-base flex items-center gap-3 border border-pink-200/80 shadow-2xs active:scale-95 transition"
            >
              <Cat className="w-6 h-6 text-pink-600 shrink-0" />
              <span>Cat Food</span>
            </button>

            <button
              onClick={() => handleCategoryClick('medicines')}
              className="text-left p-4 rounded-2xl bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 font-black text-base flex items-center gap-3 border border-emerald-200/80 shadow-2xs active:scale-95 transition"
            >
              <Pill className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>Medicines</span>
            </button>

            <button
              onClick={() => handleCategoryClick('grooming')}
              className="text-left p-4 rounded-2xl bg-purple-50/90 hover:bg-purple-100 text-purple-950 font-black text-base flex items-center gap-3 border border-purple-200/80 shadow-2xs active:scale-95 transition"
            >
              <Sparkles className="w-6 h-6 text-purple-600 shrink-0" />
              <span>Grooming</span>
            </button>

            <button
              onClick={() => handleCategoryClick('accessories')}
              className="text-left p-4 rounded-2xl bg-blue-50/90 hover:bg-blue-100 text-blue-950 font-black text-base flex items-center gap-3 border border-blue-200/80 shadow-2xs active:scale-95 transition"
            >
              <Tag className="w-6 h-6 text-blue-600 shrink-0" />
              <span>Accessories</span>
            </button>

            <button
              onClick={() => handleCategoryClick('puppy-care')}
              className="text-left p-4 rounded-2xl bg-rose-50/90 hover:bg-rose-100 text-rose-950 font-black text-base flex items-center gap-3 border border-rose-200/80 shadow-2xs active:scale-95 transition"
            >
              <Heart className="w-6 h-6 text-rose-600 shrink-0" />
              <span>Puppy Care</span>
            </button>
          </div>

          <div className="text-xs uppercase font-black text-slate-400 px-3 pt-3 tracking-wider">
            Info & Store Help
          </div>

          <button
            onClick={() => {
              navigateTo('about');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition ${
              currentPage === 'about' ? 'bg-sky-50 text-sky-600 font-black' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            About Gargee Medicose
          </button>

          <button
            onClick={() => {
              navigateTo('contact');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition ${
              currentPage === 'contact' ? 'bg-sky-50 text-sky-600 font-black' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Contact Us
          </button>

          <button
            onClick={() => {
              navigateTo('track');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition flex items-center gap-2.5 ${
              currentPage === 'track' ? 'bg-sky-50 text-sky-600 font-black' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4 text-sky-600" />
            <span>Track Delivery</span>
          </button>

          {}
          <div className="pt-3 border-t border-slate-100">
            <a
              href={businessInfo.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Customer Care Support</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
