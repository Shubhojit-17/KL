import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { productService, type Product } from '@/services/product.service';
import { userService } from '@/services/user.service';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { getImageUrl } from '@/lib/image';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Ceramic', 'Glass', 'Terracotta', 'Minimalist', 'Sculptural'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

export default function CollectionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Filter state synced with searchParams
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);

  // Sync search input when param changes externally
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Load user wishlist IDs if logged in
  useEffect(() => {
    if (!user) {
      setWishlistIds([]);
      return;
    }
    userService
      .getWishlist()
      .then((items) => setWishlistIds(items.map((i) => i._id)))
      .catch(() => {});
  }, [user]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 12,
        sort,
      };

      if (category && category !== 'All') params.category = category;
      if (search) params.search = search;
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);

      const data = await productService.getProducts(params);
      setProducts(data.products ?? []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, page, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'All') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set('page', '1'); // reset to first page on filter change
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const toggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to save pieces to your wishlist');
      return;
    }

    const isSaved = wishlistIds.includes(productId);
    try {
      if (isSaved) {
        await userService.removeFromWishlist(productId);
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
        toast.success('Removed from wishlist');
      } else {
        await userService.addToWishlist(productId);
        setWishlistIds((prev) => [...prev, productId]);
        toast.success('Saved to wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const hasActiveFilters = search || (category && category !== 'All') || minPrice || maxPrice;

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-4">
            Curated Selection
          </p>
          <h1 className="font-['Cormorant_Garamond'] font-bold text-5xl md:text-6xl text-[#FDFBF7] tracking-wide">
            The Collection
          </h1>
          <div className="h-[1px] w-20 bg-[#C5A059] mx-auto mt-6 opacity-60" />
        </motion.div>

        {/* Filter Controls Bar */}
        <div className="mb-10 space-y-6">
          {/* Search bar & Sort Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or style..."
                className="w-full bg-[#4A3528] border border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-xs py-2.5 pl-9 pr-8 focus:outline-none focus:border-[#C5A059] placeholder:text-[#FDFBF7]/40"
              />
              <Search size={14} className="absolute left-3 top-3.5 text-[#C5A059]/60" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateParam('search', '');
                  }}
                  className="absolute right-3 top-3 text-[#FDFBF7]/40 hover:text-[#FDFBF7]"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              {/* Filter Toggle Mobile/Desktop */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border font-['Montserrat'] text-xs uppercase tracking-wider transition-colors ${
                  showFilters || minPrice || maxPrice
                    ? 'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10'
                    : 'border-[#C5A059]/30 text-[#FDFBF7]/70 hover:border-[#C5A059]'
                }`}
              >
                <SlidersHorizontal size={14} /> Filters {hasActiveFilters && '•'}
              </button>

              {/* Sort Selector */}
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="bg-[#4A3528] border border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-xs py-2 px-3 focus:outline-none focus:border-[#C5A059] uppercase tracking-wider"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Collapsible Price Filter Drawer */}
          {showFilters && (
            <div className="p-4 border border-[#C5A059]/20 bg-[#4A3528]/60 flex flex-wrap items-center gap-4 text-xs font-['Montserrat'] text-[#FDFBF7]">
              <span>Price Range:</span>
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                className="w-24 bg-transparent border-b border-[#C5A059]/40 py-1 px-2 focus:outline-none focus:border-[#C5A059]"
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                className="w-24 bg-transparent border-b border-[#C5A059]/40 py-1 px-2 focus:outline-none focus:border-[#C5A059]"
              />
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#C5A059] hover:underline ml-auto"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = category === cat || (!searchParams.get('category') && cat === 'All');
              return (
                <button
                  key={cat}
                  onClick={() => updateParam('category', cat)}
                  className={`px-4 py-1.5 font-['Montserrat'] text-xs uppercase tracking-widest transition-all rounded-full shrink-0 border ${
                    active
                      ? 'bg-[#C5A059] text-[#4A3528] border-[#C5A059] font-semibold'
                      : 'border-[#C5A059]/20 text-[#FDFBF7]/60 hover:text-[#FDFBF7] hover:border-[#C5A059]/40'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-8 font-['Montserrat'] text-xs text-[#FDFBF7]/40 tracking-wider">
          <p>
            Showing {products.length} of {totalCount} piece{totalCount !== 1 ? 's' : ''}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[#C5A059] hover:underline flex items-center gap-1"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <LoadingScreen />
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-[#C5A059]/20"
          >
            <p className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7]/60 mb-4">
              No matching pieces found
            </p>
            <p className="font-['Montserrat'] text-xs text-[#FDFBF7]/40 mb-6">
              Try adjusting your search criteria or price filters.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-xs uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
            >
              View All Pieces
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product, index) => {
              const isWishlisted = wishlistIds.includes(product._id);
              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                  className="group relative"
                >
                  <Link to={`/product/${product._id}`} className="flex flex-col items-center">
                    <div className="w-full aspect-[3/4] overflow-hidden relative border border-transparent transition-all duration-500 group-hover:border-[#C5A059]/30 group-hover:shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                      <img
                        src={getImageUrl(product.images?.[0])}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                      />
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="font-['Montserrat'] text-xs text-red-300 tracking-widest uppercase border border-red-500/40 px-3 py-1 bg-black/40">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-center w-full flex flex-col items-center space-y-1.5">
                      <h3 className="font-['Cormorant_Garamond'] font-bold text-xl md:text-2xl text-[#FDFBF7] group-hover:text-[#C5A059] transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.2em] font-light">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>
                      <span className="mt-1 px-5 py-1.5 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-[9px] uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#4A3528] transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300">
                        View Details
                      </span>
                    </div>
                  </Link>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => toggleWishlist(e, product._id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-[#4A3528]/80 backdrop-blur-sm text-[#FDFBF7]/70 hover:text-red-400 transition-colors z-10"
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart
                      size={15}
                      className={isWishlisted ? 'fill-red-400 text-red-400' : ''}
                    />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-16 pt-8 border-t border-[#C5A059]/15">
            <button
              onClick={() => updateParam('page', String(Math.max(1, page - 1)))}
              disabled={page <= 1}
              className="p-2.5 border border-[#C5A059]/30 text-[#FDFBF7]/60 hover:text-[#C5A059] hover:border-[#C5A059] disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-['Montserrat'] text-xs text-[#FDFBF7]/70 tracking-widest">
              PAGE {page} OF {totalPages}
            </span>
            <button
              onClick={() => updateParam('page', String(Math.min(totalPages, page + 1)))}
              disabled={page >= totalPages}
              className="p-2.5 border border-[#C5A059]/30 text-[#FDFBF7]/60 hover:text-[#C5A059] hover:border-[#C5A059] disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
