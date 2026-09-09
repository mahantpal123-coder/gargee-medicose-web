import React from 'react';
import { useShop } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import { Heart, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, products, navigateTo, toggleWishlist } = useShop();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 transition bg-white px-3 py-1.5 rounded-full border border-slate-200 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-xs">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
                My Saved & Liked Products
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'item' : 'items'} saved in your wishlist
              </p>
            </div>
          </div>
        </div>

        {wishlistedProducts.length > 0 && (
          <button
            onClick={() => navigateTo('shop')}
            className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold px-5 py-2.5 rounded-full transition shadow-md shadow-sky-500/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        )}
      </div>

      {wishlistedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-md mx-auto my-8 space-y-4">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-400">
            <Heart className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-extrabold text-xl text-slate-800">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You haven't liked or saved any products yet. Click the heart icon on any pet food or supply item to save it for later!
            </p>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold px-6 py-3 rounded-full text-xs transition shadow-lg shadow-sky-500/25 inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore All Pet Products</span>
          </button>
        </div>
      )}
    </div>
  );
}
