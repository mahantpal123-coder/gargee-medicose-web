import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase.js';
import { onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  runTransaction
} from 'firebase/firestore';
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
  }
];

const INITIAL_ORDERS = [];

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

  // REAL-TIME FIRESTORE LISTENERS FOR INDIVIDUAL COLLECTIONS
  useEffect(() => {
    let unsubProducts = () => {};
    let unsubOrders = () => {};
    let unsubSettings = () => {};

    try {
      // 1. Listen to products collection
      unsubProducts = onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetchedProducts = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data()
            }));
            setProducts(fetchedProducts);
            try {
              localStorage.setItem('gargee_products', JSON.stringify(fetchedProducts));
            } catch (e) {}
            setCloudSyncStatus('connected');
          }
        },
        (error) => {
          console.warn('Products snapshot note:', error.message);
          setCloudSyncStatus('fallback');
        }
      );

      // 2. Listen to orders collection
      unsubOrders = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetchedOrders = snapshot.docs
              .map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data()
              }))
              .sort((a, b) => {
                const timeA = new Date(a.createdAt || a.date || 0).getTime();
                const timeB = new Date(b.createdAt || b.date || 0).getTime();
                return timeB - timeA;
              });
            setOrders(fetchedOrders);
            try {
              localStorage.setItem('gargee_orders', JSON.stringify(fetchedOrders));
            } catch (e) {}
          }
        },
        (error) => {
          console.warn('Orders snapshot note:', error.message);
        }
      );

      // 3. Listen to store settings document
      unsubSettings = onSnapshot(
        doc(db, 'settings', 'store_config'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.businessInfo) setBusinessInfoState(data.businessInfo);
            if (data.categories) setCategories(data.categories);
          }
        },
        (error) => {
          console.warn('Settings snapshot note:', error.message);
        }
      );
    } catch (err) {
      console.warn('Firestore listeners setup warning:', err);
    }

    return () => {
      unsubProducts();
      unsubOrders();
      unsubSettings();
    };
  }, []);

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
    try {
      localStorage.setItem('gargee_customer', JSON.stringify(customerData));
    } catch (e) {}
    showToast(`Welcome back, ${customerData.name || 'Pet Parent'}!`);
  };

  const customerOtpLogin = async (otpResult) => {
    const { uid, phone, fullPhone, customToken } = otpResult;
    const cleanPhone = phone || String(fullPhone || '').replace(/\D/g, '').slice(-10);
    const targetUid = uid || `phone_91${cleanPhone}`;

    if (customToken) {
      try {
        await signInWithCustomToken(auth, customToken);
      } catch (err) {
        console.warn('Firebase Custom Token sign-in warning:', err.message);
      }
    }

    const newCustomer = {
      uid: targetUid,
      name: `Pet Parent (+91 ${cleanPhone})`,
      phone: cleanPhone,
      fullPhone: fullPhone || `+91${cleanPhone}`,
      phoneVerified: true,
      authProvider: '2factor_otp',
      joinedDate: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    };

    setCurrentCustomer(newCustomer);
    try {
      localStorage.setItem('gargee_customer', JSON.stringify(newCustomer));
    } catch (e) {}
    showToast(`Mobile +91 ${cleanPhone} verified successfully!`);
    return newCustomer;
  };

  const customerLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setCurrentCustomer(null);
    setAdminUser(null);
    setIsAdminLoggedIn(false);
    localStorage.removeItem('gargee_customer');
    localStorage.removeItem('gargee_admin_auth');
    showToast('Logged out from account.');
  };

  const adminLogout = async () => {
    await signOutAdmin();
    setAdminUser(null);
    setIsAdminLoggedIn(false);
    localStorage.removeItem('gargee_admin_auth');
    showToast('Admin session locked. Logged out securely.');
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
      return [
        ...prevCart,
        {
          ...product,
          cartItemId,
          selectedVariant,
          price: finalPrice,
          oldPrice: finalOldPrice,
          quantity
        }
      ];
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
          const itemIdToMatch = item.cartItemId || item.id;
          if (itemIdToMatch === cartItemId) {
            const prod = products.find((p) => p.id === (item.productId || item.id));
            const availableStock = item.selectedVariant?.stock !== undefined
              ? Number(item.selectedVariant.stock)
              : (prod?.stock !== undefined ? Number(prod.stock) : 10);

            const newQty = item.quantity + delta;
            if (delta > 0 && newQty > availableStock) {
              showToast(`Only ${availableStock} units available in stock`);
              return { ...item, quantity: availableStock };
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((item) => (item.cartItemId || item.id) !== cartItemId));
    showToast('Item removed from cart');
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
        showToast('Removed from wishlist');
        updated = prev.filter((id) => id !== productId);
      } else {
        showToast('Saved to wishlist!');
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

  // PRODUCT CRUD (DIRECT FIRESTORE DOCUMENT OPERATIONS)
  const addProduct = async (newProduct) => {
    const prodId = newProduct.id || ('prod-' + Date.now());
    const productWithId = {
      ...newProduct,
      id: prodId,
      productId: prodId,
      price: Number(newProduct.price || 0),
      stock: newProduct.stock !== undefined ? Number(newProduct.stock) : (newProduct.inStock !== false ? 10 : 0),
      inStock: newProduct.inStock ?? true,
      active: newProduct.active ?? true,
      rating: newProduct.rating || 5.0,
      reviewsCount: newProduct.reviewsCount || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'products', prodId), productWithId);
      setProducts((prev) => [productWithId, ...prev.filter((p) => p.id !== prodId)]);
      showToast('Product added to store!');
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Failed to add product: ' + err.message);
    }
    return productWithId;
  };

  const updateProduct = async (id, updatedFields) => {
    const updatedDoc = {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    if (updatedFields.price !== undefined) updatedDoc.price = Number(updatedFields.price);
    if (updatedFields.stock !== undefined) {
      updatedDoc.stock = Number(updatedFields.stock);
      updatedDoc.inStock = updatedDoc.stock > 0;
    }

    try {
      await setDoc(doc(db, 'products', id), updatedDoc, { merge: true });
      setProducts((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedDoc } : item)));
      showToast('Product updated successfully!');
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Failed to update product: ' + err.message);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts((prev) => prev.filter((item) => item.id !== id));
      showToast('Product deleted from store.');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product: ' + err.message);
    }
  };

  const toggleProductStock = async (id) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const newInStock = target.inStock === false ? true : false;
    const newStock = newInStock ? 10 : 0;
    try {
      await updateDoc(doc(db, 'products', id), {
        inStock: newInStock,
        stock: newStock,
        updatedAt: new Date().toISOString()
      });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, inStock: newInStock, stock: newStock } : p)));
      showToast(`"${target.name.slice(0, 20)}..." marked ${newInStock ? 'In Stock' : 'Out of Stock'}`);
    } catch (err) {
      console.error('Error updating product stock:', err);
    }
  };

  const toggleProductBestSeller = async (id) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const newVal = !target.isBestSeller;
    try {
      await updateDoc(doc(db, 'products', id), {
        isBestSeller: newVal,
        updatedAt: new Date().toISOString()
      });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isBestSeller: newVal } : p)));
      showToast(`"${target.name.slice(0, 20)}..." Best Seller ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error updating best seller:', err);
    }
  };

  const toggleProductFeatured = async (id) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const newVal = !target.isFeatured;
    try {
      await updateDoc(doc(db, 'products', id), {
        isFeatured: newVal,
        updatedAt: new Date().toISOString()
      });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isFeatured: newVal } : p)));
      showToast(`"${target.name.slice(0, 20)}..." Featured ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error updating featured status:', err);
    }
  };

  // ORDER CREATION WITH ATOMIC TRANSACTION & SAFE STOCK DECREMENT
  const addOrder = async (orderData) => {
    const generatedOrderId = orderData.orderId || ('GM-' + Math.floor(100000 + Math.random() * 900000));

    const itemsWithPrice = (orderData.items || []).map((item) => {
      const unitPrice = Number(item.price || item.priceAtPurchase || 0);
      const qty = Math.max(1, Number(item.quantity || 1));
      const discount = Number(item.discount || 0);
      const gstRate = item.gstRate !== undefined ? Number(item.gstRate) : 18;
      const sku = item.sku || item.id || item.productId || '';
      const hsnCode = item.hsnCode || item.hsn || '2309';

      const lineTotal = Math.max(0, unitPrice * qty - discount);
      const taxAmount = Math.round((lineTotal * gstRate) / (100 + gstRate) * 100) / 100;
      const taxableValue = Math.round((lineTotal - taxAmount) * 100) / 100;

      return {
        id: item.id || item.productId || `item-${Date.now()}`,
        productId: item.productId || item.id || '',
        name: item.name || 'Product',
        sku: sku,
        quantity: qty,
        price: unitPrice,
        unitPrice: unitPrice,
        priceAtPurchase: unitPrice,
        discount: discount,
        gstRate: gstRate,
        hsnCode: hsnCode,
        hsn: hsnCode,
        taxableValue: taxableValue,
        taxAmount: taxAmount,
        subtotal: unitPrice * qty,
        lineTotal: lineTotal,
        image: item.image || item.imageUrl || ''
      };
    });

    const subtotal = Number(orderData.subtotal || orderData.total || 0);
    const delivery = Number(orderData.delivery || 0);
    const total = Number(orderData.total || (subtotal + delivery));

    const finalOrder = {
      ...orderData,
      orderId: generatedOrderId,
      id: generatedOrderId,
      items: itemsWithPrice,
      subtotal,
      delivery,
      total,
      paymentMethod: orderData.paymentMethod || 'Online Payment (UPI/QR on WhatsApp)',
      paymentStatus: orderData.paymentStatus || 'Paid',
      status: orderData.status || 'Pending Confirmation',
      createdAt: orderData.createdAt || new Date().toISOString(),
      date: orderData.date || new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      updatedAt: new Date().toISOString()
    };

    try {
      const orderDocRef = doc(db, 'orders', generatedOrderId);

      // Execute transaction for atomic order creation and stock update
      await runTransaction(db, async (transaction) => {
        // --- PHASE 1: ALL READS FIRST ---
        // 1. Read existing order document for idempotency check
        const existingOrderSnap = await transaction.get(orderDocRef);
        if (existingOrderSnap.exists()) {
          return;
        }

        // 2. Map and accumulate required quantities per product ID
        const productQtyMap = new Map();
        for (const item of finalOrder.items) {
          if (item.productId) {
            const currentQty = productQtyMap.get(item.productId) || 0;
            productQtyMap.set(item.productId, currentQty + item.quantity);
          }
        }

        const uniqueProductIds = Array.from(productQtyMap.keys());

        // 3. Perform ALL transaction reads in parallel before any writes
        const productSnapshots = await Promise.all(
          uniqueProductIds.map((prodId) => transaction.get(doc(db, 'products', prodId)))
        );

        const prodSnapMap = new Map();
        uniqueProductIds.forEach((prodId, idx) => {
          prodSnapMap.set(prodId, productSnapshots[idx]);
        });

        // --- PHASE 2: VALIDATE EVERYTHING IN MEMORY ---
        const stockUpdates = [];

        for (const [prodId, requiredQty] of productQtyMap.entries()) {
          const prodSnap = prodSnapMap.get(prodId);
          if (prodSnap && prodSnap.exists()) {
            const prodData = prodSnap.data();
            const currentStock = prodData.stock !== undefined ? Number(prodData.stock) : 10;

            if (currentStock < requiredQty) {
              throw new Error(`Insufficient stock for ${prodData.name || prodId}. Available: ${currentStock}, Required: ${requiredQty}`);
            }

            const newStock = Math.max(0, currentStock - requiredQty);
            stockUpdates.push({
              ref: doc(db, 'products', prodId),
              newStock,
              inStock: newStock > 0
            });
          }
        }

        // --- PHASE 3: ALL WRITES AFTER READS ---
        // 1. Update stock for all products
        for (const update of stockUpdates) {
          transaction.update(update.ref, {
            stock: update.newStock,
            inStock: update.inStock,
            updatedAt: new Date().toISOString()
          });
        }

        // 2. Write order document
        transaction.set(orderDocRef, finalOrder);
      });

      // Update local state
      setOrders((prev) => [finalOrder, ...prev.filter((o) => o.orderId !== generatedOrderId)]);
      setCloudSyncStatus('connected');
      return { success: true, order: finalOrder };
    } catch (err) {
      console.error('Firestore order creation error:', err);
      setCloudSyncStatus('fallback');

      const userFriendlyError = err.message?.includes('Insufficient stock')
        ? err.message
        : 'Order placement failed. Please try again. Your payment and stock have not been duplicated.';

      return { success: false, error: userFriendlyError, rawError: err.message, order: finalOrder };
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setOrders((prev) => prev.map((ord) => (ord.orderId === orderId ? { ...ord, status: newStatus } : ord)));
      showToast(`Order #${orderId} marked as ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const requestOrderReturn = async (orderId, reason) => {
    const targetOrder = orders.find((ord) => ord.orderId === orderId);
    if (!targetOrder) {
      showToast('Order not found');
      return false;
    }

    const returnRequestedAt = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Return Requested',
        returnRequestedAt,
        returnReason: reason,
        updatedAt: returnRequestedAt
      });
      setOrders((prev) =>
        prev.map((ord) =>
          ord.orderId === orderId ? { ...ord, status: 'Return Requested', returnRequestedAt, returnReason: reason } : ord
        )
      );
      showToast(`Return requested for Order #${orderId}`);
      return true;
    } catch (err) {
      console.error('Error requesting return:', err);
      return false;
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders((prev) => prev.filter((ord) => ord.orderId !== orderId));
      showToast('Order removed.');
    } catch (err) {
      console.error('Error deleting order:', err);
    }
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
    return newInq;
  };

  const updateInquiryStatus = (inquiryId, newStatus) => {
    const updated = inquiries.map((inq) =>
      inq.id === inquiryId ? { ...inq, status: newStatus } : inq
    );
    setInquiries(updated);
    showToast(`Inquiry marked as ${newStatus}`);
  };

  const deleteInquiry = (inquiryId) => {
    const updated = inquiries.filter((inq) => inq.id !== inquiryId);
    setInquiries(updated);
    showToast('Inquiry removed.');
  };

  const setBusinessInfo = async (newInfo) => {
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
      await setDoc(doc(db, 'settings', 'store_config'), { businessInfo: formatted }, { merge: true });
    } catch (e) {
      console.warn(e);
    }
    return formatted;
  };

  const resetAllDataToDefault = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setBusinessInfoState(INITIAL_BUSINESS_INFO);
    setOrders(INITIAL_ORDERS);
    setInquiries(INITIAL_INQUIRIES);
    showToast('Store data restored to local defaults.');
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
        setIsAdminLoggedIn,
        customerLogin,
        customerOtpLogin,
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
