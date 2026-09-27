import React, { useEffect, Component } from 'react';
import { useShop } from './context/ShopContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import CustomerLoginPage from './pages/CustomerLoginPage';
import CustomerAccountPage from './pages/CustomerAccountPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import WishlistPage from './pages/WishlistPage';
import TrackOrderPage from './pages/TrackOrderPage';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  Heart,
  User,
  CheckCircle2,
  ArrowRight,
  X,
  AlertTriangle
} from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-800">Something went wrong</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while displaying this page.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full text-xs font-bold transition shadow-md cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const {
    currentPage,
    currentCustomer,
    cartCount,
    lastAddedProduct,
    setLastAddedProduct,
    cartBadgeBump,
    navigateTo
  } = useShop();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentPage]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'shop':
        return <ShopPage />;
      case 'product':
        return <ProductDetailsPage />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'admin':
        return <AdminPage />;
      case 'login':
        return <CustomerLoginPage />;
      case 'account':
        return <CustomerAccountPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'track':
        return <TrackOrderPage />;
      case 'terms':
        return <TermsPage />;
      case 'privacy':
        return <PrivacyPolicyPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 text-slate-800 font-sans pb-16 md:pb-0">
      {/* Toast popup */}
      {lastAddedProduct && (
        <aside
          aria-label="Item added to cart notification"
          className="fixed bottom-20 md:bottom-8 right-4 left-4 sm:left-auto sm:right-8 z-50 max-w-sm bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-sky-200 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 p-1 shrink-0 overflow-hidden">
              <img
                src={lastAddedProduct.image}
                alt={lastAddedProduct.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Added to cart!</span>
              </div>
              <p className="font-bold text-xs text-slate-900 truncate">
                {lastAddedProduct.name}
              </p>
              <p className="text-[11px] font-extrabold text-sky-600">
                ₹{lastAddedProduct.price?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setLastAddedProduct(null);
                navigateTo('cart');
              }}
              className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1 shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setLastAddedProduct(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Header */}
      <Header />

      {/* Main Page View with ErrorBoundary */}
      <main className="flex-grow">
        <ErrorBoundary key={currentPage}>
          {renderCurrentPage()}
        </ErrorBoundary>
      </main>

      {/* Main Footer */}
      <Footer />

      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200 px-3 flex items-center justify-around h-18 shadow-2xl">
        <button
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
            currentPage === 'home' ? 'text-sky-600 font-black' : 'text-slate-600 font-bold'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[11px] mt-1 font-bold">Home</span>
        </button>

        <button
          onClick={() => navigateTo('shop')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
            currentPage === 'shop' ? 'text-sky-600 font-black' : 'text-slate-600 font-bold'
          }`}
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[11px] mt-1 font-bold">Shop</span>
        </button>

        <button
          onClick={() => navigateTo('wishlist')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 relative transition ${
            currentPage === 'wishlist' ? 'text-rose-600 font-black' : 'text-slate-600 font-bold'
          }`}
        >
          <Heart className="w-6 h-6" />
          <span className="text-[11px] mt-1 font-bold">Liked</span>
        </button>

        <button
          onClick={() => navigateTo(currentCustomer ? 'account' : 'login')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
            currentPage === 'login' || currentPage === 'account' ? 'text-sky-600 font-black' : 'text-slate-600 font-bold'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-[11px] mt-1 font-bold">
            {currentCustomer ? 'Profile' : 'Login'}
          </span>
        </button>

        <button
          onClick={() => navigateTo('cart')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 relative transition ${
            currentPage === 'cart' ? 'text-sky-600 font-black' : 'text-slate-600 font-bold'
          } ${cartBadgeBump ? 'cart-bump text-sky-600' : ''}`}
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className={`absolute -top-1.5 -right-2.5 bg-sky-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                cartBadgeBump ? 'scale-125 bg-emerald-500' : ''
              } transition-transform duration-200`}>
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 font-bold">Cart</span>
        </button>
      </div>
    </div>
  );
}
