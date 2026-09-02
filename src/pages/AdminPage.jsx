import React, { useState, useMemo, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { storage } from '../firebase.js';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  signInAdminWithEmail,
  signInAdminWithGoogle,
  sendAdminPasswordReset,
  getAdminEmails
} from '../utils/adminAuth';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Search,
  Phone,
  MapPin,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Lock,
  Mail,
  UserCheck,
  KeyRound,
  ShieldAlert,
  Loader2,
  Info,
  Upload,
  Image as ImageIcon,
  Sparkles,
  MessageSquare,
  X,
  Layers,
  RotateCcw
} from 'lucide-react';

export default function AdminPage() {
  const {
    products,
    categories,
    businessInfo,
    orders,
    inquiries = [],
    adminUser,
    isAdminLoggedIn,
    isAdminAuthLoading,
    cloudSyncStatus,
    syncToCloud,
    adminLogout,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStock,
    toggleProductBestSeller,
    toggleProductFeatured,
    updateOrderStatus,
    deleteOrder,
    updateInquiryStatus,
    deleteInquiry,
    setBusinessInfo,
    resetAllDataToDefault,
    navigateTo,
    showToast
  } = useShop();

  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');

  
  const [authMode, setAuthMode] = useState('login'); 
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newGalleryUrlInput, setNewGalleryUrlInput] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: 'dog-food',
    productType: '',
    price: '',
    oldPrice: '',
    image: '',
    gallery: [],
    variants: [],
    description: '',
    inStock: true,
    isBestSeller: false,
    isFeatured: false
  });

  
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');

  const [settingsForm, setSettingsForm] = useState(() => businessInfo || {});

  useEffect(() => {
    if (businessInfo) {
      setSettingsForm(businessInfo);
    }
  }, [businessInfo]);

  
  useEffect(() => {
    let interval = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutTimer]);

  
  const totalRevenue = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    return orders.reduce((sum, ord) => {
      if (ord.status === 'Cancelled') return sum;
      const rawTotal = typeof ord.total === 'string'
        ? ord.total.replace(/[^0-9.]/g, '')
        : ord.total;
      return sum + (Number(rawTotal) || 0);
    }, 0);
  }, [orders]);

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Processing'
  ).length;

  const handleAdminEmailLogin = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      await signInAdminWithEmail(emailInput, passwordInput);
      setFailedAttempts(0);
      showToast("Administrator verified & unlocked.");
    } catch (err) {
      console.error("Admin Email login error:", err);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        setLockoutTimer(60);
        setAuthError("Too many failed attempts. Locked for 60 seconds.");
      } else if (err.code === 'auth/unauthorized-admin') {
        setAuthError("Access Denied: This account is not registered as an Administrator.");
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError("Invalid admin email or password.");
      } else if (err.code === 'auth/too-many-requests') {
        setAuthError("Firebase rate limit: Access temporarily disabled due to failed logins.");
      } else {
        setAuthError(err.message || "Failed to authenticate administrator.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    if (lockoutTimer > 0) return;

    setAuthError('');
    setAuthSuccess('');
    setGoogleLoading(true);

    try {
      await signInAdminWithGoogle();
      setFailedAttempts(0);
      showToast("Google Admin identity verified.");
    } catch (err) {
      console.error("Admin Google login error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError("Google authentication popup closed.");
      } else if (err.code === 'auth/unauthorized-admin') {
        setAuthError("Access Denied: Your Google account is not in the authorized Admin whitelist.");
      } else {
        setAuthError(err.message || "Google admin sign-in failed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      await sendAdminPasswordReset(emailInput);
      setAuthSuccess("Password reset instructions sent to " + emailInput);
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === 'auth/unauthorized-admin') {
        setAuthError("This email address is not in the authorized Admin whitelist.");
      } else if (err.code === 'auth/user-not-found') {
        setAuthError("No Firebase account found with this email.");
      } else {
        setAuthError(err.message || "Could not send password reset email.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      brand: 'Pedigree',
      category: 'dog-food',
      productType: 'Dry Kibble / 1kg',
      price: '',
      oldPrice: '',
      image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=600&q=80',
      gallery: [],
      variants: [],
      description: '',
      inStock: true,
      isBestSeller: false,
      isFeatured: true
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      brand: product.brand,
      category: product.category,
      productType: product.productType || '',
      price: product.price,
      oldPrice: product.oldPrice || '',
      image: product.image,
      gallery: product.gallery && Array.isArray(product.gallery) ? product.gallery : (product.image ? [product.image] : []),
      variants: product.variants || [],
      description: product.description,
      inStock: product.inStock ?? true,
      isBestSeller: product.isBestSeller ?? false,
      isFeatured: product.isFeatured ?? false
    });
    setIsProductModalOpen(true);
  };

  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 900;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
    };
    img.src = objectUrl;
  });

  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageUploading(true);
    setUploadProgress(0);

    for (const file of files) {
      try {
        setUploadProgress(30);

        // Compress heavily for Firestore (WebP, 800px max, 70% quality) -> usually < 50KB
        const base64Data = await new Promise((resolve) => {
          const img = new Image();
          const objectUrl = URL.createObjectURL(file);
          img.onload = () => {
            const MAX = 800;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
              if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
              else { width = Math.round(width * MAX / height); height = MAX; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(objectUrl);
            const dataUrl = canvas.toDataURL('image/webp', 0.70);
            resolve(dataUrl);
          };
          img.src = objectUrl;
        });

        setUploadProgress(80);

        // Ensure it's not somehow massive (Firestore doc limit is 1MB total)
        if (base64Data.length > 500000) {
          throw new Error('Image too detailed, please use a simpler photo or an image URL.');
        }

        setProductForm((prev) => {
          const currentGallery = prev.gallery || [];
          const newGallery = currentGallery.includes(base64Data) ? currentGallery : [...currentGallery, base64Data];
          return {
            ...prev,
            image: prev.image && !prev.image.startsWith('data:') ? prev.image : base64Data,
            gallery: newGallery
          };
        });

        setUploadProgress(100);
      } catch (err) {
        console.error('Upload failed:', err);
        alert(err.message || 'Upload failed. Please paste an image URL instead.');
      }
    }

    setTimeout(() => {
      setUploadProgress(0);
      setImageUploading(false);
    }, 500);
  };

  const handleAddGalleryUrl = (urlToAdd) => {
    const trimmed = (urlToAdd || '').trim();
    if (!trimmed) return;
    setProductForm((prev) => {
      const currentGallery = prev.gallery || [];
      const newGallery = currentGallery.includes(trimmed) ? currentGallery : [...currentGallery, trimmed];
      return {
        ...prev,
        image: prev.image || trimmed,
        gallery: newGallery
      };
    });
  };

  const handleRemoveGalleryImage = (indexToRemove) => {
    setProductForm((prev) => {
      const updatedGallery = (prev.gallery || []).filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        image: updatedGallery[0] || '',
        gallery: updatedGallery
      };
    });
  };

  const handleSetMainImage = (imgSrc) => {
    setProductForm((prev) => ({
      ...prev,
      image: imgSrc
    }));
  };

  const handleProductFormSubmit = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert("Please provide at least a Product Name and Price.");
      return;
    }

    const currentGallery = productForm.gallery && productForm.gallery.length > 0
      ? productForm.gallery
      : (productForm.image ? [productForm.image] : []);

    const primaryImage = productForm.image || currentGallery[0] || '';
    const finalGallery = currentGallery.includes(primaryImage)
      ? [primaryImage, ...currentGallery.filter((img) => img !== primaryImage)]
      : [primaryImage, ...currentGallery];

    const payload = {
      ...(editingProduct || {}),
      ...productForm,
      price: Number(productForm.price),
      oldPrice: productForm.oldPrice ? Number(productForm.oldPrice) : null,
      variants: productForm.variants.filter(v => v.size && v.price), // clean up empty variants
      image: primaryImage,
      gallery: finalGallery
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    setIsProductModalOpen(false);
  };

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    setBusinessInfo(settingsForm);
    showToast("Store information and contact details saved!");
  };

  
  const filteredProducts = products.filter((p) => {
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  
  const returnOrdersCount = orders.filter(
    (o) => o.status === 'Return Requested' || Boolean(o.returnReason)
  ).length;

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'Return Requested') {
        if (o.status !== 'Return Requested' && !o.returnReason) return false;
      } else if (o.status !== orderStatusFilter) {
        return false;
      }
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      const matchId = String(o.orderId || '').toLowerCase().includes(q);
      const matchName = String(o.customer?.name || '').toLowerCase().includes(q);
      const matchPhone = String(o.customer?.phone || o.customerPhone || '').includes(q);
      const matchStatus = String(o.status || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchStatus) return false;
    }
    return true;
  });

  
  const filteredInquiries = inquiries.filter((inq) => {
    if (inquiryStatusFilter !== 'all' && inq.status !== inquiryStatusFilter) {
      return false;
    }
    if (inquirySearch.trim()) {
      const q = inquirySearch.toLowerCase();
      return (
        inq.name?.toLowerCase().includes(q) ||
        inq.phone?.includes(q) ||
        inq.message?.toLowerCase().includes(q) ||
        inq.petType?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const newInquiriesCount = inquiries.filter((inq) => inq.status === 'New').length;

  
  if (isAdminAuthLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mx-auto animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-bold text-slate-500">
          Verifying administrator credentials...
        </p>
      </div>
    );
  }

  
  if (!isAdminLoggedIn) {
    const adminEmailsList = getAdminEmails();

    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          {}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-sky-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                Firebase Protected
              </span>
              <h1 className="font-heading text-2xl font-black text-slate-900 mt-2">
                Store Admin Portal
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gargee Medicose Management Dashboard
              </p>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`py-2 rounded-xl transition ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('info');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`py-2 rounded-xl transition ${
                authMode === 'info'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Access Info
            </button>
          </div>

          {}
          {authMode === 'info' && (
            <div className="space-y-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Configured Authorized Admins</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Only authenticated Firebase accounts matching the administrator whitelist or possessing custom claims are granted access.
              </p>
              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
                {adminEmailsList.map((email, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{email}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition text-xs"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {}
          {authMode === 'forgot' && (
            <form onSubmit={handlePasswordReset} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Admin Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="admin@gargeemedicose.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {authError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 text-sm cursor-pointer"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Link</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-1"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {}
          {authMode === 'login' && (
            <div className="space-y-4">
              {}
              <button
                type="button"
                onClick={handleAdminGoogleLogin}
                disabled={googleLoading || authLoading || lockoutTimer > 0}
                className="w-full py-3 px-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-3 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{googleLoading ? 'Authenticating...' : 'Sign in with Google Admin'}</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">or email</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              {}
              <form onSubmit={handleAdminEmailLogin} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Admin Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. mahantpal123@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {lockoutTimer > 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Locked due to failed attempts. Try again in {lockoutTimer}s</span>
                  </div>
                )}

                {authError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading || googleLoading || lockoutTimer > 0}
                  className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Authenticate Administrator</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="pt-2 text-center border-t border-slate-100">
            <button
              onClick={() => navigateTo('home')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Store</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center font-black text-xl text-white shadow-md">
            GM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl sm:text-2xl font-black">
                Gargee Medicose Control Panel
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Admin:</span>
              <strong className="text-sky-300 font-mono">{adminUser?.email || 'Authenticated Store Admin'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => {
              syncToCloud();
              showToast("Pushed all products and changes to Live Cloud!");
            }}
            className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-full transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Force push all products to Cloud"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sync to Cloud</span>
          </button>

          <button
            onClick={() => navigateTo('home')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-full transition flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>View Public Store</span>
          </button>

          <button
            onClick={adminLogout}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold px-4 py-2.5 rounded-full transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Secure Sign Out</span>
          </button>
        </div>
      </div>

      {}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard & Sales</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'products'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'orders'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Customer Orders ({orders.length})</span>
          {returnOrdersCount > 0 && (
            <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {returnOrdersCount}
            </span>
          )}
          {activeOrdersCount > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {activeOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'inquiries'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Inquiries / Leads ({inquiries.length})</span>
          {newInquiriesCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {newInquiriesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'settings'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Store Settings & Info</span>
        </button>
      </div>

      {}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Revenue
              </span>
              <p className="font-heading text-2xl font-black text-slate-900">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold">
                From completed & active orders
              </p>
            </div>

            <div
              onClick={() => {
                setActiveTab('orders');
                setOrderStatusFilter('Return Requested');
              }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1 cursor-pointer hover:bg-slate-50 transition"
            >
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Return Requests
              </span>
              <p className="font-heading text-2xl font-black text-slate-900">
                {returnOrdersCount}
              </p>
              <p className="text-[10px] text-slate-500 font-bold">
                {returnOrdersCount > 0 ? 'Click to view returns' : 'No pending returns'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Orders
              </span>
              <p className="font-heading text-2xl font-black text-slate-900">
                {orders.length}
              </p>
              <p className="text-[10px] text-amber-600 font-bold">
                {activeOrdersCount} pending / in progress
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Customer Inquiries
              </span>
              <p className="font-heading text-2xl font-black text-slate-900">
                {inquiries.length}
              </p>
              <p className="text-[10px] text-rose-600 font-bold">
                {newInquiriesCount} new leads
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Catalog Items
              </span>
              <p className="font-heading text-2xl font-black text-slate-900">
                {products.length}
              </p>
              <p className="text-[10px] text-sky-600 font-bold">
                {products.filter((p) => p.inStock).length} in stock
              </p>
            </div>
          </div>

          {}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-slate-900 text-base">
                  Recent Customer Orders
                </h3>
                <p className="text-xs text-slate-400">
                  Latest delivery requests from Bilaspur pet parents
                </p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 font-bold">Order ID</th>
                    <th className="pb-3 font-bold">Customer</th>
                    <th className="pb-3 font-bold">Total</th>
                    <th className="pb-3 font-bold">Payment</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((ord) => (
                    <tr key={ord.orderId} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-900">
                        #{ord.orderId}
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-slate-800">{ord.customer?.name || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400">{ord.customer?.phone || ''}</p>
                      </td>
                      <td className="py-3 font-black text-slate-900">
                        ₹{(Number(ord.total) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 uppercase text-[10px] font-bold text-slate-600">
                        {ord.customer?.paymentMethod || 'N/A'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-700'
                              : ord.status === 'Processing'
                              ? 'bg-sky-100 text-sky-700'
                              : ord.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <select
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.orderId, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold px-2 py-1 focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-slate-900 text-base">
                  Latest Inquiries & Message Requests
                </h3>
                <p className="text-xs text-slate-400">
                  Customer queries submitted from store Contact Page
                </p>
              </div>
              <button
                onClick={() => setActiveTab('inquiries')}
                className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
              >
                <span>View All Inquiries</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {inquiries.slice(0, 3).map((inq) => (
                <div key={inq.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{inq.name}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                        {inq.petType}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.2 rounded-full ${
                          inq.status === 'New'
                            ? 'bg-rose-100 text-rose-700'
                            : inq.status === 'Contacted'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-1">{inq.message}</p>
                    <p className="text-[10px] text-slate-400">{inq.date}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://wa.me/91${(inq.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste ${inq.name}, we received your inquiry regarding ${inq.petType} at Gargee Medicose.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-1 rounded-full text-[11px] inline-flex items-center gap-1 transition"
                    >
                      <Phone className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            {}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search products by name or brand..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={openAddProductModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          {}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock Status</th>
                    <th className="py-3 px-4">Badges</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-100 shrink-0"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-sky-600 uppercase block">
                              {product.brand}
                            </span>
                            <p className="font-bold text-slate-800 line-clamp-1 max-w-xs">
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize font-semibold text-slate-600">
                        {product.category.replace('-', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900">
                          ₹{product.price.toLocaleString('en-IN')}
                        </div>
                        {product.oldPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{product.oldPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleProductStock(product.id)}
                          className={`text-[10px] font-extrabold px-3 py-1 rounded-full transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                            product.inStock !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                          }`}
                          title="Click to toggle Stock Status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.inStock !== false ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{product.inStock !== false ? 'In Stock' : 'Out of Stock'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => toggleProductBestSeller(product.id)}
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md transition border cursor-pointer active:scale-95 ${
                              product.isBestSeller
                                ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-2xs font-extrabold'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:border-slate-300'
                            }`}
                            title="Click to toggle Best Seller status"
                          >
                            ⭐ Best Seller
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleProductFeatured(product.id)}
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md transition border cursor-pointer active:scale-95 ${
                              product.isFeatured
                                ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-2xs font-extrabold'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:border-slate-300'
                            }`}
                            title="Click to toggle Featured status"
                          >
                            ✨ Featured
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditProductModal(product)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${product.name}"?`)) {
                              deleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                placeholder="Search by order number..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Filter Status:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold px-3 py-1.5 focus:outline-none"
              >
                <option value="all">All Orders ({orders.length})</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Return Requested">Return Requested ({orders.filter(o => o.status === 'Return Requested').length})</option>
                <option value="Returned">Returned</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Deleted">Deleted / Archived</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              return (
              <div
                key={ord.orderId}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4"
              >
                {/* Return reason note */}
                {ord.returnReason && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Return Reason:</span> {ord.returnReason}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-black text-slate-900 text-base">
                        Order #{ord.orderId}
                      </h4>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          ord.status === 'Return Requested'
                            ? 'bg-purple-100 text-purple-700'
                            : ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : ord.status === 'Processing'
                            ? 'bg-sky-100 text-sky-700'
                            : ord.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Placed on: {ord.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={ord.status}
                      onChange={(e) => updateOrderStatus(ord.orderId, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold px-3 py-1.5 focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Return Requested">Return Requested</option>
                      <option value="Returned">Returned / Refunded</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Deleted">Archived / Deleted</option>
                    </select>

                    <button
                      onClick={() => {
                        if (confirm(`Remove order #${ord.orderId}?`)) {
                          deleteOrder(ord.orderId);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {}
                  <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl">
                    <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                      Customer Details
                    </h5>
                    <p className="font-bold text-slate-800 text-sm">
                      {ord.customer?.name || 'N/A'}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-sky-600" />
                      <a href={`tel:${ord.customer?.phone || ''}`} className="font-bold text-sky-600">
                        {ord.customer?.phone || 'N/A'}
                      </a>
                    </p>
                    <p className="text-slate-600 flex items-start gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{ord.customer?.address || ''}{ord.customer?.city ? `, ${ord.customer.city}` : ''}{ord.customer?.pincode ? ` - ${ord.customer.pincode}` : ''}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold pt-1">
                      Payment Mode: {ord.customer?.paymentMethod || 'N/A'}
                    </p>
                  </div>

                  {}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                      Items Ordered
                    </h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {(ord.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sky-600">x{item.quantity}</span>
                            <span className="text-slate-800 font-medium truncate max-w-[180px]">{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-900">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-between font-black text-sm text-slate-900">
                      <span>Total Amount:</span>
                      <span className="text-sky-600">₹{(Number(ord.total) || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by name, phone or query..."
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500">Filter:</span>
              <select
                value={inquiryStatusFilter}
                onChange={(e) => setInquiryStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold px-3 py-2 focus:outline-none flex-1 sm:flex-initial"
              >
                <option value="all">All Inquiries ({inquiries.length})</option>
                <option value="New">New ({inquiries.filter((i) => i.status === 'New').length})</option>
                <option value="Contacted">Contacted ({inquiries.filter((i) => i.status === 'Contacted').length})</option>
                <option value="Resolved">Resolved ({inquiries.filter((i) => i.status === 'Resolved').length})</option>
              </select>
            </div>
          </div>

          {}
          <div className="space-y-3">
            {filteredInquiries.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-bold">No customer inquiries found</p>
                <p className="text-[11px] text-slate-400">
                  When pet parents submit messages on the Contact Page, they will appear here instantly with 1-click WhatsApp reply and call options.
                </p>
              </div>
            ) : (
              filteredInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-black text-sm shrink-0">
                        {inq.name ? inq.name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-black text-slate-900 text-sm">
                            {inq.name}
                          </h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {inq.petType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{inq.date}</p>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-2">
                      <select
                        value={inq.status}
                        onChange={(e) => updateInquiryStatus(inq.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none ${
                          inq.status === 'New'
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : inq.status === 'Contacted'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}
                      >
                        <option value="New">Status: New</option>
                        <option value="Contacted">Status: Contacted</option>
                        <option value="Resolved">Status: Resolved</option>
                      </select>

                      <button
                        onClick={() => {
                          if (confirm(`Delete inquiry from ${inq.name}?`)) {
                            deleteInquiry(inq.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {}
                  <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed border border-slate-100/80">
                    <span className="font-bold text-[10px] uppercase text-slate-400 block mb-1">
                      Customer Query / Requirement:
                    </span>
                    <p className="text-slate-800 font-medium whitespace-pre-wrap">{inq.message}</p>
                  </div>

                  {}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-sky-600" />
                      <span className="font-bold text-slate-900">+91 {inq.phone}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:+91${inq.phone.replace(/\D/g, '')}`}
                        className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Customer</span>
                      </a>

                      <a
                        href={`https://wa.me/91${(inq.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste ${inq.name}, we received your inquiry regarding ${inq.petType} at Gargee Medicose.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1 transition shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Reply on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-lg">
              Store Information & Contact Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update phone numbers, store address, announcement and Instagram link
            </p>
          </div>

          <form onSubmit={handleSettingsSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Business Name</label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Phone Number (10 Digits)</label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Top Header Announcement Text</label>
              <input
                type="text"
                value={settingsForm.announcement}
                onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Full Store Address</label>
              <textarea
                rows="2"
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Instagram Handle</label>
                <input
                  type="text"
                  value={settingsForm.instagram}
                  onChange={(e) => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">City / Location</label>
                <input
                  type="text"
                  value={settingsForm.city}
                  onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Reset all products and settings to default demo values?")) {
                    resetAllDataToDefault();
                  }
                }}
                className="text-rose-600 hover:underline font-bold text-xs"
              >
                Reset Store Data to Default
              </button>

              <button
                type="submit"
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </form>

          {}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Multi-Device Cloud Synchronization</span>
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                cloudSyncStatus === 'connected'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {cloudSyncStatus === 'connected' ? 'Firestore Live' : 'Active Multi-Device Sync'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every edit to products, prices, stock, or contact details automatically syncs to all devices visiting the store.
            </p>
          </div>
        </div>
      )}

      {}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading font-black text-slate-900 text-lg">
              {editingProduct ? 'Edit Product' : 'Add New Pet Product'}
            </h3>

            <form onSubmit={handleProductFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Canin Maxi Adult"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Canin"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 899"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">MRP / Old Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 999"
                    value={productForm.oldPrice}
                    onChange={(e) => setProductForm({ ...productForm, oldPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Short Product Type / Variant</label>
                <input
                  type="text"
                  placeholder="e.g. Chicken & Vegetables (3kg)"
                  value={productForm.productType}
                  onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Product Size Variants */}
              <div className="space-y-2 border border-sky-100 bg-sky-50/50 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 text-xs block">
                      Multiple Sizes / Weights (Optional)
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Add if this product comes in different packs (e.g. 1kg, 3kg, 10kg)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProductForm((prev) => ({
                        ...prev,
                        variants: [...prev.variants, { size: '', price: '', oldPrice: '', inStock: true }]
                      }));
                    }}
                    className="bg-white hover:bg-sky-100 text-sky-600 border border-sky-200 font-bold px-3 py-1.5 rounded-xl text-[11px] inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Size Variant</span>
                  </button>
                </div>

                {productForm.variants?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {productForm.variants.map((v, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-2 rounded-xl border border-sky-100 relative">
                        <input
                          type="text"
                          placeholder="Size (e.g. 3kg)"
                          required
                          value={v.size}
                          onChange={(e) => {
                            const newVariants = [...productForm.variants];
                            newVariants[idx].size = e.target.value;
                            setProductForm({ ...productForm, variants: newVariants });
                          }}
                          className="w-full sm:w-1/3 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                        <div className="flex w-full sm:w-2/3 gap-2">
                          <input
                            type="number"
                            placeholder="Price"
                            required
                            value={v.price}
                            onChange={(e) => {
                              const newVariants = [...productForm.variants];
                              newVariants[idx].price = e.target.value;
                              setProductForm({ ...productForm, variants: newVariants });
                            }}
                            className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                          <input
                            type="number"
                            placeholder="MRP"
                            value={v.oldPrice}
                            onChange={(e) => {
                              const newVariants = [...productForm.variants];
                              newVariants[idx].oldPrice = e.target.value;
                              setProductForm({ ...productForm, variants: newVariants });
                            }}
                            className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newVariants = productForm.variants.filter((_, i) => i !== idx);
                            setProductForm({ ...productForm, variants: newVariants });
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition absolute top-2 right-2 sm:static"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 text-xs block">
                      Product Photos & Gallery ({productForm.gallery?.length || 0})
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Upload multiple photos or paste image links
                    </span>
                  </div>
                  <label className={`${imageUploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-600 active:scale-95 cursor-pointer'} text-white font-bold px-3 py-1.5 rounded-xl text-[11px] inline-flex items-center gap-1.5 shadow-xs transition`}>
                    {imageUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{imageUploading ? `Uploading ${uploadProgress}%` : 'Upload Photos'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileUpload}
                      disabled={imageUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {}
                {productForm.gallery && productForm.gallery.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                      {productForm.gallery.map((img, idx) => {
                        const isMain = productForm.image === img || (!productForm.image && idx === 0);
                        return (
                          <div
                            key={idx}
                            className={`relative group w-20 h-20 rounded-xl bg-white border p-1 shrink-0 overflow-hidden shadow-2xs transition-all ${
                              isMain ? 'border-sky-500 ring-2 ring-sky-300' : 'border-slate-200'
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-contain cursor-pointer"
                              onClick={() => handleSetMainImage(img)}
                            />
                            {isMain && (
                              <span className="absolute bottom-1 left-1 right-1 bg-sky-600 text-white text-[9px] font-black text-center rounded py-0.5 pointer-events-none">
                                Main
                              </span>
                            )}
                            <div className="absolute top-1 right-1 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveGalleryImage(idx);
                                }}
                                className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] hover:bg-rose-700 shadow-xs cursor-pointer"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      Click any photo to set it as the Primary Store Image. Hover and click ✕ to delete.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-dashed border-slate-300 text-center space-y-1">
                    <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-[11px] text-slate-500 font-medium">No gallery photos added yet</p>
                  </div>
                )}

                {}
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Or paste an image URL (https://...)"
                    value={newGalleryUrlInput}
                    onChange={(e) => setNewGalleryUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGalleryUrl(newGalleryUrlInput);
                        setNewGalleryUrlInput('');
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAddGalleryUrl(newGalleryUrlInput);
                      setNewGalleryUrlInput('');
                    }}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Short Description</label>
                <textarea
                  rows="2"
                  placeholder="Nutritional description..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              {}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                    className="accent-sky-500"
                  />
                  <span className="font-bold text-slate-700">In Stock</span>
                </label>

                <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isBestSeller}
                    onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                    className="accent-sky-500"
                  />
                  <span className="font-bold text-slate-700">Best Seller</span>
                </label>

                <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="accent-sky-500"
                  />
                  <span className="font-bold text-slate-700">Featured</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 text-white font-bold py-2.5 rounded-xl shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
