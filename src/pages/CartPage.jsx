import React from 'react';
import { useShop } from '../context/ShopContext';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    deliveryFee,
    cartTotal,
    navigateTo
  } = useShop();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-800">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500 mt-2">
              Looks like you haven't added anything to your cart yet. Explore our fresh pet food, supplements and accessories!
            </p>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-6 rounded-full text-sm transition shadow-md"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-3xl font-black text-slate-900">
            Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            You have <strong className="text-slate-800">{cart.length}</strong> items in your cart
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-500 hover:text-rose-700 font-bold transition px-3 py-1.5 rounded-full bg-rose-50"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {}
        <div className="lg:col-span-8 space-y-3 sm:space-y-4">
          {cart.map((item) => {
            const itemKey = item.cartItemId || item.id;
            return (
            <div
              key={itemKey}
              className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-200/80 shadow-sm flex flex-row items-center gap-3 sm:gap-6"
            >
              {}
              <div
                onClick={() => navigateTo('product', { productId: item.id })}
                className="w-18 h-18 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-slate-50 p-1.5 overflow-hidden shrink-0 cursor-pointer border border-slate-100"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {}
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 block truncate">
                  {item.brand}
                </span>
                <h3
                  onClick={() => navigateTo('product', { productId: item.id })}
                  className="font-heading font-extrabold text-slate-900 text-xs sm:text-base hover:text-sky-600 cursor-pointer transition line-clamp-1"
                >
                  {item.name} {item.selectedVariant && <span className="text-slate-500 font-semibold">({item.selectedVariant.size})</span>}
                </h3>

                <div className="flex items-center justify-between pt-1">
                  {}
                  <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 p-0.5 sm:p-1">
                    <button
                      onClick={() => updateCartQuantity(itemKey, -1)}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-slate-700 hover:bg-slate-200 font-extrabold flex items-center justify-center transition shadow-xs text-xs"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-6 sm:w-8 text-center text-xs font-black text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(itemKey, 1)}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-slate-700 hover:bg-slate-200 font-extrabold flex items-center justify-center transition shadow-xs text-xs"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {}
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => removeFromCart(itemKey)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );})}

          {}
          <div className="pt-2">
            <button
              onClick={() => navigateTo('shop')}
              className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>

        {}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md space-y-5 sticky top-24">
            <h3 className="font-heading font-black text-slate-900 text-base sm:text-lg border-b pb-3">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">
                  ₹{cartSubtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Delivery (Bilaspur)</span>
                <span className="font-bold text-emerald-600">
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>

              {deliveryFee > 0 && (
                <p className="text-xs text-sky-700 bg-sky-50 p-2.5 rounded-xl font-medium">
                  Add ₹{(1000 - cartSubtotal).toLocaleString('en-IN')} more to qualify for <strong>FREE Delivery</strong>!
                </p>
              )}

              <div className="border-t pt-3 flex justify-between text-base sm:text-lg font-heading font-black text-slate-900">
                <span>Total Amount</span>
                <span className="text-sky-600">
                  ₹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigateTo('checkout')}
              className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-extrabold py-3.5 px-6 rounded-full text-sm transition shadow-lg shadow-sky-500/25 active:scale-95 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-sky-500 shrink-0" />
                <span>2-Day Easy Return & Replacement Policy</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Genuine Certified Pet Supplies</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
                <span>100% Secure Online & UPI Payment Accepted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
