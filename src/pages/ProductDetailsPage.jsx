import React, { useState, useEffect, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/mockData';
import ProductCard from '../components/ProductCard';
import {
  Star,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Share2,
  ChevronLeft,
  Check
} from 'lucide-react';

export default function ProductDetailsPage() {
  const {
    selectedProductId,
    products,
    addToCart,
    toggleWishlist,
    wishlist,
    navigateTo,
    businessInfo
  } = useShop();

  // Always resolve to a valid product immediately (using INITIAL_PRODUCTS fallback)
  const product = useMemo(() => {
    const list = (products && products.length > 0) ? products : INITIAL_PRODUCTS;
    if (!selectedProductId) return list[0];
    const match = list.find(
      (p) =>
        String(p.id) === String(selectedProductId) ||
        String(p.productId) === String(selectedProductId)
    );
    return match || list[0];
  }, [products, selectedProductId]);

  // All state hooks at top level unconditionally
  const [selectedImage, setSelectedImage] = useState(
    product?.gallery?.[0] || product?.image || product?.imageUrl || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80'
  );
  const [selectedVariant, setSelectedVariant] = useState(
    (product?.variants && product?.variants.length > 0) ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [selectedProductId]);

  // Sync image, variant, and quantity when product resolves/changes
  useEffect(() => {
    if (product) {
      const defaultImg =
        product.gallery?.[0] || product.image || product.imageUrl || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80';
      setSelectedImage(defaultImg);

      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setQuantity(1);
    }
  }, [product]);

  // Calculate wishlist status safely
  const isWishlisted = useMemo(() => {
    if (!product || !wishlist) return false;
    const targetId = product.id || product.productId;
    return wishlist.includes(targetId);
  }, [product, wishlist]);

  // Calculate related products safely
  const relatedProducts = useMemo(() => {
    const list = (products && products.length > 0) ? products : INITIAL_PRODUCTS;
    if (!product) return [];
    const category = product.category;
    const currentId = product.id || product.productId;
    return list
      .filter(
        (p) =>
          p.category === category &&
          p.id !== currentId &&
          p.productId !== currentId
      )
      .slice(0, 4);
  }, [product, products]);

  // Safe pricing & stock logic
  const displayPrice = selectedVariant
    ? Number(selectedVariant.price || 0)
    : Number(product.price || 0);

  const displayOldPrice = selectedVariant && selectedVariant.oldPrice
    ? Number(selectedVariant.oldPrice)
    : product.oldPrice
    ? Number(product.oldPrice)
    : null;

  const availableStock = selectedVariant && selectedVariant.stock !== undefined
    ? Number(selectedVariant.stock)
    : (product.stock !== undefined ? Number(product.stock) : (product.inStock !== false ? 10 : 0));

  const displayInStock = availableStock > 0 && (selectedVariant ? selectedVariant.inStock !== false : product.inStock !== false);
  const isLowStock = displayInStock && availableStock <= 5;

  const handleAddToCart = () => {
    if (!displayInStock) return;
    addToCart(product, quantity, selectedVariant);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  const handleBuyNow = () => {
    if (!displayInStock) return;
    addToCart(product, quantity, selectedVariant);
    navigateTo('cart');
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    setIsHeartAnimating(true);
    toggleWishlist(product.id || product.productId);
    setTimeout(() => setIsHeartAnimating(false), 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10 pb-28 md:pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigateTo('shop')}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-sky-600 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>
      </div>

      {/* Main product box */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Product Images */}
        <div className="md:col-span-6 space-y-3">
          <div className="relative aspect-square w-full rounded-2xl bg-slate-50 p-4 flex items-center justify-center overflow-hidden border border-slate-100">
            {displayOldPrice && displayOldPrice > displayPrice && (
              <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full z-10 shadow-xs">
                Special Offer
              </span>
            )}
            <button
              onClick={handleWishlistToggle}
              className={`absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-md z-10 cursor-pointer active:scale-90 ${
                isWishlisted
                  ? 'bg-rose-500 text-white shadow-rose-500/30 ring-2 ring-rose-300'
                  : 'bg-white/90 backdrop-blur-sm text-slate-400 hover:text-rose-500 hover:bg-white border border-slate-200'
              }`}
              title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
              aria-label="Wishlist"
            >
              <Heart
                className={`w-5.5 h-5.5 transition-transform duration-200 ${
                  isWishlisted ? 'fill-current text-white' : 'stroke-[2]'
                } ${isHeartAnimating ? 'heart-pop' : ''}`}
              />
            </button>
            <img
              src={selectedImage || product.image || product.imageUrl || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80'}
              alt={product.name || 'Product'}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80';
              }}
            />
          </div>

          {/* Gallery Thumbnails */}
          {Array.isArray(product.gallery) && product.gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border p-1 bg-white shrink-0 cursor-pointer ${
                    selectedImage === img ? 'border-sky-500' : 'border-slate-200'
                  }`}
                >
                  <img
                    src={img}
                    alt="thumb"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Actions */}
        <div className="md:col-span-6 space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
              {product.brand || 'Gargee Medicose'}
            </span>

            <h1 className="font-heading text-lg sm:text-2xl font-bold text-slate-900 mt-1 leading-snug">
              {product.name || 'Pet Care Product'}
            </h1>

            <div className="flex items-center gap-3 mt-2 text-xs">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md font-bold">
                <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                <span>{product.rating || 5.0}</span>
              </div>
              <span className="text-slate-400">({product.reviewsCount || 1} reviews)</span>
              {!displayInStock ? (
                <span className="text-rose-600 font-bold ml-auto sm:ml-0 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full text-xs border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="text-amber-700 font-black ml-auto sm:ml-0 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full text-xs border border-amber-200 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Only {availableStock} left in stock - order soon!
                </span>
              ) : (
                <span className="text-emerald-700 font-bold ml-auto sm:ml-0 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full text-xs border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  In Stock ({availableStock} available)
                </span>
              )}
            </div>
          </div>

          {/* Variants Selection */}
          {Array.isArray(product.variants) && product.variants.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-600 mb-2 block">Select Size / Variant:</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                      selectedVariant?.size === variant.size
                        ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-baseline gap-2 py-2 border-y border-slate-100">
            <span className="font-heading text-2xl font-black text-slate-900">
              ₹{(displayPrice || 0).toLocaleString('en-IN')}
            </span>
            {displayOldPrice && displayOldPrice > displayPrice && (
              <span className="text-sm text-slate-400 line-through">
                ₹{displayOldPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600">Quantity:</span>
            <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 p-0.5">
              <button
                disabled={!displayInStock || quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 rounded-full bg-white text-slate-700 font-bold flex items-center justify-center text-xs disabled:opacity-40 cursor-pointer"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-black text-slate-800">
                {quantity}
              </span>
              <button
                disabled={!displayInStock || quantity >= availableStock}
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                className="w-7 h-7 rounded-full bg-white text-slate-700 font-bold flex items-center justify-center text-xs disabled:opacity-40 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Desktop Add to Cart & Buy Now */}
          <div className="hidden md:grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={!displayInStock}
              className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-full text-xs transition-all duration-200 ${
                !displayInStock
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : isAdded
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-sky-500 hover:bg-sky-600 active:scale-98 text-white cursor-pointer shadow-md shadow-sky-500/25'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>{!displayInStock ? 'Out of Stock' : 'Add to Cart'}</span>
                </>
              )}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!displayInStock}
              className={`font-bold py-3 px-4 rounded-full text-xs transition ${
                !displayInStock
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-98'
              }`}
            >
              {!displayInStock ? 'Currently Unavailable' : 'Buy Now'}
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
            <a
              href={businessInfo?.whatsappUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 p-2 bg-slate-50 hover:bg-emerald-50 rounded-xl transition"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span className="font-extrabold text-[11px] text-slate-800">Customer Support</span>
              <span className="text-[9px] text-slate-500">WhatsApp Chat</span>
            </a>
            <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl">
              <Truck className="w-4 h-4 text-purple-600" />
              <span className="font-extrabold text-[11px] text-slate-800">Fast Delivery</span>
              <span className="text-[9px] text-slate-500">All India delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-extrabold text-[11px] text-slate-800">100% Genuine</span>
              <span className="text-[9px] text-slate-500">Verified authentic</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-1 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Description
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Features */}
          {Array.isArray(product.features) && product.features.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Product Details
              </h3>
              <ul className="space-y-1 text-xs text-slate-600">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-sky-500 font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900">
            Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id || rel.productId} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Floating Bottom Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3 h-16">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold leading-none">Total</span>
          <span className="font-heading text-base font-black text-slate-900 leading-tight">
            ₹{((displayPrice || 0) * (quantity || 1)).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-[220px]">
          <button
            onClick={handleAddToCart}
            disabled={!displayInStock}
            className={`flex-1 font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition-all duration-200 ${
              !displayInStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : 'bg-sky-50 text-sky-600 active:scale-95 cursor-pointer'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 animate-in zoom-in-50" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={!displayInStock}
            className={`flex-1 font-extrabold py-2.5 px-3 rounded-xl text-xs text-center transition ${
              !displayInStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-sky-500 active:bg-sky-600 text-white active:scale-95 cursor-pointer shadow-md shadow-sky-500/25'
            }`}
          >
            {!displayInStock ? 'Unavailable' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
