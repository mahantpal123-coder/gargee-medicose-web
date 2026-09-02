import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, enableNetwork, disableNetwork } from 'firebase/firestore';
import { verifyIsAdmin, signOutAdmin } from '../utils/adminAuth.js';
import {
  PRODUCTS as INITIAL_PRODUCTS,
  CATEGORIES as INITIAL_CATEGORIES,
  BUSINESS_INFO as INITIAL_BUSINESS_INFO
} from '../data/mockData';

const ShopContext = createContext();

const INITIAL_INQUIRIES = [
  {
    id: "inq-101",
    date: "28 Aug 2026, 04:30 PM",
    name: "Vikram Singhania",
    phone: "9826199887",
    petType: "Dog",
    message: "Do you have Royal Canin Golden Retriever Junior 12kg available in stock?",
    status: "New"
  },
  {
    id: "inq-102",
    date: "27 Aug 2026, 11:15 AM",
    name: "Dr. Neha Patel",
    phone: "9425233445",
    petType: "Wholesale",
    message: "Looking for bulk supply of Petstar puppy dry food and tick spray for our clinic in Bilaspur.",
    status: "Contacted"
  }
];

const INITIAL_ORDERS = [
  {
    "orderId": "GM-782194",
    "date": "26 Aug 2026",
    "customerPhone": "9826112233",
    "customer": {
      "name": "Ramesh Sharma",
      "phone": "9826112233",
      "email": "ramesh.bilaspur@gmail.com",
      "address": "House 24, Nehru Nagar, Near Shiv Mandir",
      "city": "Bilaspur",
      "state": "Chhattisgarh",
      "pincode": "495001",
      "paymentMethod": "upi"
    },
    "items": [
      {
        "id": "rc-maxi-adult",
        "name": "Royal Canin Maxi Adult Dog Food",
        "brand": "Royal Canin",
        "price": 3250,
        "quantity": 1,
        "image": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80"
      },
      {
        "id": "drools-dog-treats-calcium-bone",
        "name": "Drools Absolute Calcium Bone Treats",
        "brand": "Drools",
        "price": 350,
        "quantity": 2,
        "image": "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=500&q=80"
      }
    ],
    "subtotal": 3950,
    "delivery": 0,
    "total": 3950,
    "status": "Processing"
  },
  {
    "orderId": "GM-541298",
    "date": "25 Aug 2026",
    "customerPhone": "9179044556",
    "customer": {
      "name": "Pooja Verma",
      "phone": "9179044556",
      "email": "pooja.v@outlook.com",
      "address": "Flat 302, Sai Vihar Apartment, Vyapar Vihar",
      "city": "Bilaspur",
      "state": "Chhattisgarh",
      "pincode": "495004",
      "paymentMethod": "upi"
    },
    "items": [
      {
        "id": "whiskas-ocean-fish-adult",
        "name": "Whiskas Adult Dry Cat Food",
        "brand": "Whiskas",
        "price": 499,
        "quantity": 2,
        "image": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80"
      }
    ],
    "subtotal": 998,
    "delivery": 70,
    "total": 1068,
    "status": "Delivered"
  }
];

export function ShopProvider({ children }) {
  
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('/admin') || hash === '#admin' || search.includes('admin')) {
        return 'admin';
      }
    }
    return 'home';
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('/admin') || hash === '#admin' || search.includes('admin')) {
        setCurrentPage('admin');
        window.scrollTo(0, 0);
      }
    };

    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setCurrentPage('admin');
        window.location.hash = 'admin';
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  
  const [currentCustomer, setCurrentCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('gargee_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  
  const [adminUser, setAdminUser] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(true);

  // Fallback: if Firebase auth never fires (network issue), stop loading after 5s
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAdminAuthLoading(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('syncing'); 

  
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('gargee_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('gargee_categories');
      if (!saved) return INITIAL_CATEGORIES;
      const parsed = JSON.parse(saved);
      return parsed.map((cat) => {
        const initial = INITIAL_CATEGORIES.find((c) => c.id === cat.id);
        return initial ? { ...cat, image: initial.image } : cat;
      });
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  
  const [businessInfo, setBusinessInfoState] = useState(() => {
    try {
      const saved = localStorage.getItem('gargee_business_info');
      return saved ? JSON.parse(saved) : INITIAL_BUSINESS_INFO;
    } catch {
      return INITIAL_BUSINESS_INFO;
    }
  });

  
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('gargee_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  
  const [inquiries, setInquiries] = useState(() => {
    try {
      const saved = localStorage.getItem('gargee_inquiries');
      return saved ? JSON.parse(saved) : INITIAL_INQUIRIES;
    } catch {
      return INITIAL_INQUIRIES;
    }
  });

  
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('gargee_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy corrupt cart items (e.g. unknown Orijen items)
          return parsed.filter((item) => item && item.id && !item.name?.toLowerCase().includes('orijen'));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gargee_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('gargee_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);
  const [cartBadgeBump, setCartBadgeBump] = useState(false);
  const [wishlistBadgeBump, setWishlistBadgeBump] = useState(false);

  
  const applyRemoteCatalogData = (data) => {
    if (!data) return;
    if (Array.isArray(data.products) && data.products.length > 0) {
      setProducts(data.products);
      try {
        localStorage.setItem('gargee_products', JSON.stringify(data.products));
      } catch (e) {
        console.warn(e);
      }
    }
    if (Array.isArray(data.categories) && data.categories.length > 0) {
      const mergedCategories = data.categories.map((cat) => {
        const initial = INITIAL_CATEGORIES.find((c) => c.id === cat.id);
        return initial ? { ...cat, image: initial.image } : cat;
      });
      setCategories(mergedCategories);
      try {
        localStorage.setItem('gargee_categories', JSON.stringify(mergedCategories));
      } catch (e) {
        console.warn(e);
      }
    }
    if (data.businessInfo && typeof data.businessInfo === 'object') {
      setBusinessInfoState(data.businessInfo);
      try {
        localStorage.setItem('gargee_business_info', JSON.stringify(data.businessInfo));
      } catch (e) {
        console.warn(e);
      }
    }
    if (Array.isArray(data.orders)) {
      setOrders(data.orders);
      try {
        localStorage.setItem('gargee_orders', JSON.stringify(data.orders));
      } catch (e) {
        console.warn(e);
      }
    }
    if (Array.isArray(data.inquiries)) {
      setInquiries(data.inquiries);
      try {
        localStorage.setItem('gargee_inquiries', JSON.stringify(data.inquiries));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  
  useEffect(() => {
    let unsubscribe = () => {};

    const catalogDocRef = doc(db, 'store_catalog', 'main_catalog');

    // Immediately fetch latest data from Firestore on mount (bypasses stale localStorage)
    getDoc(catalogDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          applyRemoteCatalogData(docSnap.data());
          setCloudSyncStatus('connected');
        }
      })
      .catch((err) => {
        console.warn('Firestore initial fetch error:', err.message);
      });

    // Then keep real-time listener for live updates
    try {
      unsubscribe = onSnapshot(
        catalogDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            applyRemoteCatalogData(docSnap.data());
            setCloudSyncStatus('connected');
          }
        },
        (error) => {
          console.warn("Firestore listener note:", error.message);
          setCloudSyncStatus('fallback');
        }
      );
    } catch (err) {
      console.warn("Firestore setup:", err);
      setCloudSyncStatus('fallback');
    }

    return () => unsubscribe();
  }, []);

  
  const syncToCloud = async (overrideData = {}) => {
    const payload = {
      products: overrideData.products || products,
      categories: overrideData.categories || categories,
      businessInfo: overrideData.businessInfo || businessInfo,
      orders: overrideData.orders || orders,
      inquiries: overrideData.inquiries || inquiries,
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage
    try {
      localStorage.setItem('gargee_products', JSON.stringify(payload.products));
      localStorage.setItem('gargee_categories', JSON.stringify(payload.categories));
      localStorage.setItem('gargee_business_info', JSON.stringify(payload.businessInfo));
      localStorage.setItem('gargee_orders', JSON.stringify(payload.orders));
      localStorage.setItem('gargee_inquiries', JSON.stringify(payload.inquiries));
    } catch (e) {
      console.warn(e);
    }

    // Save to Firestore (primary source of truth for all devices)
    try {
      const catalogDocRef = doc(db, 'store_catalog', 'main_catalog');
      await setDoc(catalogDocRef, payload, { merge: true });
      setCloudSyncStatus('connected');
    } catch (err) {
      console.error("Firestore sync warning:", err);
      if (typeof window !== 'undefined') {
        alert("Failed to sync to live database: " + err.message);
      }
    }
  };

  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = await verifyIsAdmin(user);
        if (isAdmin) {
          setAdminUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Store Administrator',
            photoURL: user.photoURL || ''
          });
          setIsAdminLoggedIn(true);
        } else {
          setAdminUser(null);
          setIsAdminLoggedIn(false);
        }

        setCurrentCustomer((prev) => {
          const rawPhone = user.phoneNumber ? user.phoneNumber.replace('+91', '').replace(/\D/g, '') : (prev?.phone || '');
          const customerData = {
            uid: user.uid,
            name: prev?.name || user.displayName || 'Pet Parent',
            phone: rawPhone,
            email: user.email || prev?.email || '',
            joinedDate: prev?.joinedDate || new Date().toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric'
            })
          };
          return customerData;
        });
      } else {
        setAdminUser(null);
        setIsAdminLoggedIn(false);
      }
      setIsAdminAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  
  const customerLogin = (customerData) => {
    setCurrentCustomer(customerData);
    showToast(`Welcome back, ${customerData.name || 'Pet Parent'}!`);
  };

  const customerLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    setCurrentCustomer(null);
    setAdminUser(null);
    setIsAdminLoggedIn(false);
    localStorage.removeItem('gargee_customer');
    localStorage.removeItem('gargee_admin_auth');
    showToast("Logged out from account.");
  };

  const adminLogout = async () => {
    await signOutAdmin();
    setAdminUser(null);
    setIsAdminLoggedIn(false);
    localStorage.removeItem('gargee_admin_auth');
    showToast("Admin session locked. Logged out securely.");
  };

  
  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    const cartItemId = selectedVariant ? `${product.id}-${selectedVariant.size}` : product.id;
    const finalPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
    const finalOldPrice = selectedVariant && selectedVariant.oldPrice ? Number(selectedVariant.oldPrice) : product.oldPrice;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prevCart.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, {
        ...product,
        cartItemId,
        selectedVariant,
        price: finalPrice,
        oldPrice: finalOldPrice,
        quantity
      }];
    });

    setCartBadgeBump(true);
    setTimeout(() => setCartBadgeBump(false), 700);

    setLastAddedProduct({
      ...product,
      quantity,
      selectedVariant,
      timestamp: Date.now()
    });
    setTimeout(() => setLastAddedProduct(null), 3500);

    showToast(`Added "${product.name.slice(0, 24)}..." to cart!`);
  };

  const updateCartQuantity = (cartItemId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          // Fallback to item.id for backwards compatibility with old cart data
          const itemIdToMatch = item.cartItemId || item.id;
          if (itemIdToMatch === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((item) => (item.cartItemId || item.id) !== cartItemId));
    showToast("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId) => {
    setWishlistBadgeBump(true);
    setTimeout(() => setWishlistBadgeBump(false), 600);

    setWishlist((prev) => {
      const exists = prev.includes(productId);
      let updated;
      if (exists) {
        showToast("Removed from wishlist");
        updated = prev.filter((id) => id !== productId);
      } else {
        showToast("Saved to wishlist!");
        updated = [...prev, productId];
      }
      try {
        localStorage.setItem('gargee_wishlist', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  
  const addProduct = (newProduct) => {
    const productWithId = {
      ...newProduct,
      id: newProduct.id || 'prod-' + Date.now(),
      rating: newProduct.rating || 5.0,
      reviewsCount: newProduct.reviewsCount || 1,
      inStock: newProduct.inStock ?? true
    };
    const updated = [productWithId, ...products];
    setProducts(updated);
    syncToCloud({ products: updated });
    showToast("Product added to store!");
    return productWithId;
  };

  const updateProduct = (id, updatedFields) => {
    const updated = products.map((item) => (item.id === id ? { ...item, ...updatedFields } : item));
    setProducts(updated);
    syncToCloud({ products: updated });
    showToast("Product updated successfully!");
  };

  const deleteProduct = (id) => {
    const updated = products.filter((item) => item.id !== id);
    setProducts(updated);
    syncToCloud({ products: updated });
    showToast("Product deleted from store.");
  };

  const toggleProductStock = (id) => {
    const updated = products.map((item) =>
      item.id === id ? { ...item, inStock: item.inStock === false ? true : false } : item
    );
    setProducts(updated);
    syncToCloud({ products: updated });
    const target = updated.find((p) => p.id === id);
    showToast(`"${target?.name?.slice(0, 20)}..." marked ${target?.inStock ? 'In Stock' : 'Out of Stock'}`);
  };

  const toggleProductBestSeller = (id) => {
    const updated = products.map((item) =>
      item.id === id ? { ...item, isBestSeller: !item.isBestSeller } : item
    );
    setProducts(updated);
    syncToCloud({ products: updated });
    const target = updated.find((p) => p.id === id);
    showToast(`"${target?.name?.slice(0, 20)}..." Best Seller ${target?.isBestSeller ? 'enabled' : 'disabled'}`);
  };

  const toggleProductFeatured = (id) => {
    const updated = products.map((item) =>
      item.id === id ? { ...item, isFeatured: !item.isFeatured } : item
    );
    setProducts(updated);
    syncToCloud({ products: updated });
    const target = updated.find((p) => p.id === id);
    showToast(`"${target?.name?.slice(0, 20)}..." Featured ${target?.isFeatured ? 'enabled' : 'disabled'}`);
  };

  
  const addOrder = (orderData) => {
    const updated = [orderData, ...orders];
    setOrders(updated);
    syncToCloud({ orders: updated });
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map((ord) =>
      ord.orderId === orderId ? { ...ord, status: newStatus } : ord
    );
    setOrders(updated);
    syncToCloud({ orders: updated });
    showToast(`Order #${orderId} marked as ${newStatus}`);
  };

  const requestOrderReturn = (orderId, reason) => {
    const targetOrder = orders.find((ord) => ord.orderId === orderId);
    if (!targetOrder) {
      showToast("Order not found");
      return false;
    }

    const returnRequestedAt = new Date().toISOString();
    const updated = orders.map((ord) =>
      ord.orderId === orderId
        ? {
            ...ord,
            status: "Return Requested",
            returnRequestedAt,
            returnReason: reason
          }
        : ord
    );
    setOrders(updated);
    syncToCloud({ orders: updated });
    showToast(`Return requested for Order #${orderId}`);

    // Send return notification to admin (email + WhatsApp)
    try {
      fetch('/api/send-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customer: targetOrder.customer,
          items: targetOrder.items,
          total: targetOrder.total,
          reason,
          returnRequestedAt
        })
      }).catch((err) => console.warn('Return notification failed:', err));
    } catch (e) {
      console.warn('Return notification error:', e);
    }

    return true;
  };

  const deleteOrder = (orderId) => {
    const updated = orders.filter((ord) => ord.orderId !== orderId);
    setOrders(updated);
    syncToCloud({ orders: updated });
    showToast("Order removed.");
  };

  
  const addInquiry = (inquiryData) => {
    const newInq = {
      id: inquiryData.id || 'inq-' + Date.now(),
      date: inquiryData.date || new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      name: inquiryData.name || 'Anonymous Pet Parent',
      phone: inquiryData.phone || '',
      petType: inquiryData.petType || 'General',
      message: inquiryData.message || '',
      status: inquiryData.status || 'New'
    };
    const updated = [newInq, ...inquiries];
    setInquiries(updated);
    syncToCloud({ inquiries: updated });
    return newInq;
  };

  const updateInquiryStatus = (inquiryId, newStatus) => {
    const updated = inquiries.map((inq) =>
      inq.id === inquiryId ? { ...inq, status: newStatus } : inq
    );
    setInquiries(updated);
    syncToCloud({ inquiries: updated });
    showToast(`Inquiry marked as ${newStatus}`);
  };

  const deleteInquiry = (inquiryId) => {
    const updated = inquiries.filter((inq) => inq.id !== inquiryId);
    setInquiries(updated);
    syncToCloud({ inquiries: updated });
    showToast("Inquiry removed.");
  };

  const setBusinessInfo = (newInfo) => {
    const rawPhone = (newInfo.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 12 && rawPhone.startsWith('91') ? rawPhone.slice(2) : rawPhone;
    const formattedPhone = cleanPhone.length === 10
      ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`
      : cleanPhone ? `+91 ${cleanPhone}` : '';

    const rawInsta = (newInfo.instagram || '').trim();
    const instagramClean = rawInsta.replace('@', '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
    const instagramUrl = rawInsta.startsWith('http')
      ? rawInsta
      : instagramClean ? `https://instagram.com/${instagramClean}` : '';

    const storeName = (newInfo.name || businessInfo.name || 'Gargee Medicose').trim();

    const formatted = {
      ...businessInfo,
      ...newInfo,
      name: storeName,
      phone: cleanPhone,
      phoneFormatted: formattedPhone,
      whatsappUrl: `https://wa.me/91${cleanPhone}`,
      instagram: instagramClean ? `@${instagramClean}` : '',
      instagramUrl: instagramUrl
    };

    setBusinessInfoState(formatted);
    try {
      localStorage.setItem('gargee_business_info', JSON.stringify(formatted));
    } catch (e) {
      console.warn(e);
    }
    syncToCloud({ businessInfo: formatted });
    return formatted;
  };

  
  const resetAllDataToDefault = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setBusinessInfoState(INITIAL_BUSINESS_INFO);
    setOrders(INITIAL_ORDERS);
    setInquiries(INITIAL_INQUIRIES);
    syncToCloud({
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,
      businessInfo: INITIAL_BUSINESS_INFO,
      orders: INITIAL_ORDERS,
      inquiries: INITIAL_INQUIRIES
    });
    showToast("Store data restored to factory defaults.");
  };

  const navigateTo = (page, params = {}) => {
    if (params.productId) setSelectedProductId(params.productId);
    if (params.category !== undefined) setSelectedCategory(params.category);
    if (params.search !== undefined) setSearchQuery(params.search);
    setCurrentPage(page);
    if (page === 'admin') {
      window.location.hash = 'admin';
    } else if (window.location.hash === '#admin') {
      try {
        window.history.pushState('', document.title, window.location.pathname + window.location.search);
      } catch (e) {
        console.warn(e);
      }
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = cartSubtotal > 1000 || cartSubtotal === 0 ? 0 : 70;
  const cartTotal = cartSubtotal + deliveryFee;

  return (
    <ShopContext.Provider
      value={{
        currentPage,
        selectedProductId,
        selectedCategory,
        searchQuery,
        setSearchQuery,
        setSelectedCategory,
        products,
        categories,
        businessInfo,
        orders,
        inquiries,
        cart,
        wishlist,
        cartCount,
        cartSubtotal,
        deliveryFee,
        cartTotal,
        toastMessage,
        lastAddedProduct,
        setLastAddedProduct,
        cartBadgeBump,
        wishlistBadgeBump,
        currentCustomer,
        adminUser,
        isAdminLoggedIn,
        isAdminAuthLoading,
        cloudSyncStatus,
        syncToCloud,
        setIsAdminLoggedIn,
        customerLogin,
        customerLogout,
        adminLogout,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStock,
        toggleProductBestSeller,
        toggleProductFeatured,
        addOrder,
        updateOrderStatus,
        requestOrderReturn,
        deleteOrder,
        addInquiry,
        updateInquiryStatus,
        deleteInquiry,
        setBusinessInfo,
        resetAllDataToDefault,
        navigateTo,
        showToast
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
