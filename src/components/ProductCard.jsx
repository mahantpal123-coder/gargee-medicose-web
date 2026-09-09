import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Star, ShoppingCart, Heart, Check } from 'lucide-react';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist, navigateTo } = useShop();
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = () => {
    // If variants exist, Quick Add defaults to the first variant
    const defaultVariant = product.variants?.length > 0 ? product.variants[0] : null;
    const isOutOfStock = defaultVariant ? defaultVariant.inStock === false : product.inStock === false;

    if (isOutOfStock) return;
    addToCart(product, 1, defaultVariant);
    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 1200);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    setIsHeartAnimating(true);
    toggleWishlist(product.id);
    setTimeout(() => setIsHeartAnimating(false), 500);
  };

  // Determine display price and stock
  const displayPrice = product.variants?.length > 0 ? Number(product.variants[0].price) : product.price;
  const displayOldPrice = product.variants?.length > 0 ? (product.variants[0].oldPrice ? Number(product.variants[0].oldPrice) : null) : product.oldPrice;
  const hasVariants = product.variants?.length > 0;
  const availableStock = hasVariants
    ? (product.variants[0].stock !== undefined ? Number(product.variants[0].stock) : (product.variants[0].inStock !== false ? 10 : 0))
    : (product.stock !== undefined ? Number(product.stock) : (product.inStock !== false ? 10 : 0));
  const isOutOfStock = availableStock <= 0 || (hasVariants ? product.variants[0].inStock === false : product.inStock === false);
  const isLowStock = !isOutOfStock && availableStock <= 5;

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200 hover:border-sky-400 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between h-[410px] sm:h-[400px] relative overflow-hidden select-none">
      {/* Product Image Box */}
      <div
        onClick={() => navigateTo('product', { productId: product.id })}
        className="relative w-full h-[210px] sm:h-[190px] rounded-xl sm:rounded-2xl bg-slate-50 p-2 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 border border-slate-100"
      >
        {isOutOfStock ? (
          <span className="absolute top-2.5 left-2.5 bg-slate-900 text-white text-xs font-black px-2.5 py-0.5 rounded-full z-10 shadow-xs">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full z-10 shadow-xs animate-pulse">
            Only {availableStock} Left!
          </span>
        ) : displayOldPrice ? (
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
          alt={product.name}
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

      {}
      <div className="flex-1 flex flex-col justify-between pt-2.5">
        <div className="space-y-1">
          {}
          <span className="block text-xs font-extrabold text-sky-600 uppercase tracking-wider truncate">
            {product.brand}
          </span>

          {}
          <h3
            onClick={() => navigateTo('product', { productId: product.id })}
            className="font-heading font-extrabold text-slate-900 text-sm sm:text-[15px] leading-snug line-clamp-2 hover:text-sky-600 cursor-pointer transition h-[38px] sm:h-[42px]"
            title={product.name}
          >
            {product.name}
          </h3>

          {}
          <p className="text-xs text-slate-500 truncate font-medium">
            {product.productType || product.description}
          </p>
        </div>

        {}
        <div className="pt-2.5 mt-auto border-t border-slate-100 space-y-2">
          {}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {hasVariants && <span className="text-[10px] text-slate-500 font-bold">From</span>}
              <span className="font-heading font-black text-lg sm:text-xl text-slate-950 leading-none">
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>
              {displayOldPrice && (
                <span className="text-xs text-slate-400 line-through font-semibold">
                  ₹{displayOldPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-extrabold text-xs shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{product.rating}</span>
            </div>
          </div>

          {}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center gap-2 font-extrabold py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all duration-200 ${
              isOutOfStock
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
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

