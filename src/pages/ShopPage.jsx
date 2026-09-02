import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { BRANDS } from '../data/mockData';
import ProductCard from '../components/ProductCard';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';

export default function ShopPage() {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery
  } = useShop();

  const [selectedBrand, setSelectedBrand] = useState('all');
  const [priceRange, setPriceRange] = useState(5000);
  const [sortBy, setSortBy] = useState('popular'); 
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }
      
      if (selectedBrand !== 'all' && product.brand !== selectedBrand) {
        return false;
      }
      
      if (product.price > priceRange) {
        return false;
      }
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesDesc = (product.description || '').toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesDesc) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
    });
  }, [products, selectedCategory, selectedBrand, priceRange, searchQuery, sortBy]);

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand('all');
    setPriceRange(5000);
    setSearchQuery('');
    setSortBy('popular');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {}
      <div className="mb-8 bg-gradient-to-r from-sky-50 to-indigo-50/40 p-6 sm:p-8 rounded-3xl border border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-3 py-1 rounded-full">
            Online Store
          </span>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            {selectedCategory
              ? categories.find(c => c.id === selectedCategory)?.name || 'Products'
              : 'All Pet Products'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Showing <strong className="text-slate-800">{filteredProducts.length}</strong> items for dogs, cats & everyday pet care
          </p>
        </div>

        {}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-white border border-slate-200 text-slate-800 px-4 py-2.5 rounded-full text-xs font-bold shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            <span>Filters</span>
          </button>

          {}
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-slate-200 shadow-sm text-xs font-bold">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="popular">Best Selling</option>
              <option value="rating">Top Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {}
        <div className="hidden lg:block space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-sky-500" />
                <span>Filters</span>
              </h3>
              <button
                onClick={resetFilters}
                className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                Categories
              </h4>
              <div className="space-y-1.5 text-sm">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    selectedCategory === null
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Categories</span>
                  <span>{products.length}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                      selectedCategory === cat.id
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[11px] opacity-70">
                      {products.filter((p) => p.category === cat.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Max Price
                </h4>
                <span className="text-xs font-black text-sky-600">
                  Up to ₹{priceRange}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>₹100</span>
                <span>₹5,000</span>
              </div>
            </div>

            {}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                Brands
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-sky-600">
                  <input
                    type="radio"
                    name="brand"
                    checked={selectedBrand === 'all'}
                    onChange={() => setSelectedBrand('all')}
                    className="text-sky-600 focus:ring-sky-500 accent-sky-500"
                  />
                  <span>All Brands</span>
                </label>
                {BRANDS.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-sky-600"
                  >
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedBrand === brand}
                      onChange={() => setSelectedBrand(brand)}
                      className="text-sky-600 focus:ring-sky-500 accent-sky-500"
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-xs bg-white h-full p-6 space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-heading font-bold text-slate-800 text-lg">Filters</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 mb-3">Category</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                      selectedCategory === null ? 'bg-sky-500 text-white' : 'text-slate-700'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                        selectedCategory === cat.id ? 'bg-sky-500 text-white' : 'text-slate-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 mb-2">Brands</h4>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="radio"
                      name="mbrand"
                      checked={selectedBrand === 'all'}
                      onChange={() => setSelectedBrand('all')}
                    />
                    <span>All Brands</span>
                  </label>
                  {BRANDS.map((b) => (
                    <label key={b} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="radio"
                        name="mbrand"
                        checked={selectedBrand === b}
                        onChange={() => setSelectedBrand(b)}
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 bg-slate-100 py-2.5 rounded-xl text-xs font-bold text-slate-700"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 bg-sky-500 text-white py-2.5 rounded-xl text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {}
        <div className="lg:col-span-3">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-4">
              <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-800">
                No matching products found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any products matching your current filters. Try changing or resetting them.
              </p>
              <button
                onClick={resetFilters}
                className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-6 py-2.5 rounded-full transition shadow-md"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
