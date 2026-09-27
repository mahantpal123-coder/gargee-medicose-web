import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Star, ShoppingCart, Heart, Check } from 'lucide-react';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist, cart, navigateTo } = useShop();
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  if (!product) return null;

  const productId = product.id || product.productId || '';
  const isWishlisted = Array.isArray(wishlist) ? wishlist.includes(productId) : false;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;
  const firstVariant = hasVariants ? variants[0] : null;

  const displayPrice = firstVariant
    ? Number(firstVariant.price || 0)
    : Number(product.price || 0);

  const displayOldPrice = firstVariant
    ? (firstVariant.oldPrice ? Number(firstVariant.oldPrice) : null)
    : (product.oldPrice ? Number(product.oldPrice) : null);

  const availableStock = firstVariant
    ? (firstVariant.stock !== undefined ? Number(firstVariant.stock) : (firstVariant.inStock !== false ? 10 : 0))
    : (product.stock !== undefined ? Number(product.stock) : (product.inStock !== false ? 10 : 0));

  const isOutOfStock = availableStock <= 0 || (firstVariant ? firstVariant.inStock === false : product.inStock === false);
  const isLowStock = !isOutOfStock && availableStock <= 5;

  const cartItemId = firstVariant ? `${product.id}-${firstVariant.size}` : product.id;
  const cartItem = Array.isArray(cart) ? cart.find((item) => item.cartItemId === cartItemId) : null;
  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const isMaxInCart = cartQuantity >= availableStock;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock || isMaxInCart) return;
    addToCart(product, 1, firstVariant);
    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 1200);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    setIsHeartAnimating(true);
    toggleWishlist(productId);
    setTimeout(() => setIsHeartAnimating(false), 500);
  };

  const handleCardNavigate = () => {
    if (productId) {
      navigateTo('product', { productId });
    }
  };

  return (
    <div
      onClick={handleCardNavigate}
      className="group bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200 hover:border-sky-400 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between h-[410px] sm:h-[400px] relative overflow-hidden select-none cursor-pointer"
    >
      {/* Product Image Box */}
      <div className="relative w-full h-[210px] sm:h-[190px] rounded-xl sm:rounded-2xl bg-slate-50 p-2 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
        {isOutOfStock ? (
          <span className="absolute top-2.5 left-2.5 bg-slate-900 text-white text-xs font-black px-2.5 py-0.5 rounded-full z-10 shadow-xs">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full z-10 shadow-xs animate-pulse">
            Only {availableStock} Left!
          </span>
        ) : (displayOldPrice && displayOldPrice > displayPrice) ? (
          <span className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full z-10 shadow-xs">
            Save ₹{displayOldPrice - displayPrice}
          </span>
        ) : null}

        <button
          onClick={handleWishlistClick}
          className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md z-10 cursor-pointer active:scale-90 ${
            isWishlisted
              ? 'bg-rose-500 text-white shadow-rose-500/30 ring-2 ring-rose-300'
              : 'bg-white/90 backdrop-blur-sm text-slate-400 hover:text-rose-500 hover:bg-white border border-slate-200'
          }`}
          title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          aria-label="Wishlist"
        >
          <Heart
            className={`w-4.5 h-4.5 transition-transform duration-200 ${
              isWishlisted ? 'fill-current text-white' : 'stroke-[2]'
            } ${isHeartAnimating ? 'heart-pop' : ''}`}
          />
        </button>

        <img
          src={product.image || product.imageUrl || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80'}
          alt={product.name || 'Product'}
          className={`w-full h-full transition-transform duration-300 sm:object-contain sm:scale-100 sm:group-hover:scale-105 ${
            product.imageFit === 'cover'
              ? 'max-sm:object-cover max-sm:group-hover:scale-105'
              : product.imageFit === 'scale'
              ? 'max-sm:object-cover max-sm:scale-110 max-sm:group-hover:scale-125'
              : 'max-sm:object-contain max-sm:group-hover:scale-105'
          }`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80';
          }}
          loading="lazy"
        />
      </div>

      {/* Info Content */}
      <div className="flex-1 flex flex-col justify-between pt-2.5">
        <div className="space-y-1">
          <span className="block text-xs font-extrabold text-sky-600 uppercase tracking-wider truncate">
            {product.brand || 'Gargee Medicose'}
          </span>

          <h3
            className="font-heading font-extrabold text-slate-900 text-sm sm:text-[15px] leading-snug line-clamp-2 hover:text-sky-600 transition h-[38px] sm:h-[42px]"
            title={product.name}
          >
            {product.name || 'Pet Product'}
          </h3>

          <p className="text-xs text-slate-500 truncate font-medium">
            {product.productType || product.description || ''}
          </p>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2.5 mt-auto border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {hasVariants && <span className="text-[10px] text-slate-500 font-bold">From</span>}
              <span className="font-heading font-black text-lg sm:text-xl text-slate-950 leading-none">
                ₹{(displayPrice || 0).toLocaleString('en-IN')}
              </span>
              {displayOldPrice && (
                <span className="text-xs text-slate-400 line-through font-semibold">
                  ₹{displayOldPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-extrabold text-xs shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{product.rating || 5.0}</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isMaxInCart}
            className={`w-full flex items-center justify-center gap-2 font-extrabold py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all duration-200 ${
              isOutOfStock || isMaxInCart
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : isJustAdded
                ? 'bg-emerald-500 text-white scale-98 shadow-md shadow-emerald-500/30'
                : 'bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white active:scale-98 shadow-md shadow-sky-500/25 cursor-pointer'
            }`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-4 h-4 animate-in zoom-in-50 duration-200" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>{isOutOfStock ? 'Out of Stock' : isMaxInCart ? `Max (${availableStock}) in Cart` : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
