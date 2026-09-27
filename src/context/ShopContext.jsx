import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { verifyIsAdmin, signOutAdmin } from '../utils/adminAuth.js';
import {
  PRODUCTS as INITIAL_PRODUCTS,
  CATEGORIES as INITIAL_CATEGORIES,
  BUSINESS_INFO as INITIAL_BUSINESS_INFO
} from '../data/mockData';

let _adminToken = null;

const api = async (path, options = {}) => {
  const { headers, ...rest } = options;
  const tokenHeader = _adminToken ? { Authorization: `Bearer ${_adminToken}` } : {};
  const resp = await fetch(path, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...tokenHeader, ...headers }
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Request failed (${resp.status})`);
  return data;
};

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

  // LIVE SYNC VIA REST POLLING (Hostinger MySQL backend)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [prodData, orderData, catalogData] = await Promise.all([
          api('/api/products').catch(() => null),
          api('/api/orders').catch(() => null),
          api('/api/catalog').catch(() => null)
        ]);

        if (cancelled) return;

        if (prodData?.products?.length) {
          setProducts(prodData.products);
          try {
            localStorage.setItem('gargee_products', JSON.stringify(prodData.products));
          } catch (e) {}
        }

        if (orderData?.orders?.length) {
          const fetchedOrders = [...orderData.orders].sort((a, b) => {
            const timeA = new Date(a.createdAt || a.date || 0).getTime();
            const timeB = new Date(b.createdAt || b.date || 0).getTime();
            return timeB - timeA;
          });
          setOrders(fetchedOrders);
          try {
            localStorage.setItem('gargee_orders', JSON.stringify(fetchedOrders));
          } catch (e) {}
        }

        const catalog = catalogData?.data;
        if (catalog?.businessInfo) setBusinessInfoState(catalog.businessInfo);
        if (catalog?.categories) setCategories(catalog.categories);

        setCloudSyncStatus(prodData ? 'connected' : 'fallback');
      } catch (err) {
        if (!cancelled) {
          console.warn('Sync note:', err.message);
          setCloudSyncStatus('fallback');
        }
      }
    };

    load();
    const timer = setInterval(load, 30000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = await verifyIsAdmin(user);
        if (isAdmin) {
          const token = await user.getIdToken();
          _adminToken = token;
          setAdminUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Store Administrator',
            photoURL: user.photoURL || '',
            getIdToken: () => user.getIdToken()
          });
          setIsAdminLoggedIn(true);
        } else {
          _adminToken = null;
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
    _adminToken = null;
    setAdminUser(null);
    setIsAdminLoggedIn(false);
    localStorage.removeItem('gargee_admin_auth');
    showToast('Admin session locked. Logged out securely.');
  };

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    const cartItemId = selectedVariant ? `${product.id}-${selectedVariant.size}` : product.id;
    const finalPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
    const finalOldPrice = selectedVariant && selectedVariant.oldPrice ? Number(selectedVariant.oldPrice) : product.oldPrice;

    const availableStock = selectedVariant?.stock !== undefined
      ? Number(selectedVariant.stock)
      : (product.stock !== undefined ? Number(product.stock) : (product.inStock !== false ? 10 : 0));

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > availableStock) {
          showToast(`Only ${availableStock} units available. You already have ${existing.quantity} in cart.`);
          return prevCart.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: availableStock }
              : item
          );
        }
        return prevCart.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: newQty }
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
      await api('/api/products', { method: 'POST', body: JSON.stringify(productWithId) });
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
      await api('/api/products', { method: 'PUT', body: JSON.stringify({ id, ...updatedDoc }) });
      setProducts((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedDoc } : item)));
      showToast('Product updated successfully!');
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Failed to update product: ' + err.message);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
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
      await api('/api/products', {
        method: 'PUT',
        body: JSON.stringify({ id, inStock: newInStock, stock: newStock })
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
      await api('/api/products', { method: 'PUT', body: JSON.stringify({ id, isBestSeller: newVal }) });
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
      await api('/api/products', { method: 'PUT', body: JSON.stringify({ id, isFeatured: newVal }) });
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
      // Backend owns the transaction: validates stock, decrements atomically,
      // recalculates totals, and enforces idempotency on generatedOrderId.
      const result = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...finalOrder,
          customerId: orderData.customerId || orderData.customer?.uid || null
        })
      });

      const savedOrder = result.order || finalOrder;

      setOrders((prev) => [savedOrder, ...prev.filter((o) => o.orderId !== generatedOrderId)]);
      setCloudSyncStatus('connected');
      return { success: true, order: savedOrder };
    } catch (err) {
      console.error('Order creation error:', err);
      setCloudSyncStatus('fallback');

      const userFriendlyError = err.message?.includes('Insufficient stock')
        ? err.message
        : 'Order placement failed. Please try again. Your payment and stock have not been duplicated.';

      return { success: false, error: userFriendlyError, rawError: err.message, order: finalOrder };
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const targetOrder = orders.find((ord) => ord.orderId === orderId || ord.id === orderId);

    try {
      const updates = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      if (newStatus === 'Delivered') {
        updates.deliveredAt = new Date().toISOString();
      }

      await api('/api/orders', {
        method: 'PUT',
        body: JSON.stringify({ orderId, status: newStatus })
      });

      // Dispatch status update notification email to customer
      if (targetOrder?.customer?.email || targetOrder?.customerEmail) {
        fetch('/api/send-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'status_update',
            orderId,
            newStatus,
            customer: targetOrder.customer || { email: targetOrder.customerEmail, name: targetOrder.customer_name },
            order: targetOrder
          })
        }).catch((err) => console.warn('Status notification email notice:', err.message));
      }

      setOrders((prev) => prev.map((ord) => (ord.orderId === orderId || ord.id === orderId ? { ...ord, ...updates } : ord)));
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
      await api('/api/orders', {
        method: 'PUT',
        body: JSON.stringify({ orderId, status: 'Return Requested', returnReason: reason, returnRequestedAt })
      });
      setOrders((prev) =>
        prev.map((ord) =>
          ord.orderId === orderId ? { ...ord, status: 'Return Requested', returnRequestedAt, returnReason: reason } : ord
        )
      );

      fetch('/api/send-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customer: targetOrder.customer || currentCustomer,
          items: targetOrder.items,
          total: targetOrder.total,
          reason,
          returnRequestedAt
        })
      }).catch((e) => console.warn('Return notification error:', e));

      showToast(`Return requested for Order #${orderId}`);
      return true;
    } catch (err) {
      console.error('Error requesting return:', err);
      return false;
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await api(`/api/orders?id=${encodeURIComponent(orderId)}`, { method: 'DELETE' });
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
    } catch (e) {
      console.warn(e);
    }

    api('/api/catalog', {
      method: 'PUT',
      body: JSON.stringify({ businessInfo: formatted })
    })
      .catch((e) => console.warn('Business info sync note:', e.message));
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
