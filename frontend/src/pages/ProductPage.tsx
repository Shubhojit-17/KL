import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Minus, Plus, Heart, Star, ShieldCheck } from 'lucide-react';
import { productService, type Product } from '@/services/product.service';
import { userService } from '@/services/user.service';
import { reviewService, type Review, type ReviewsResponse } from '@/services/review.service';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { getImageUrl } from '@/lib/image';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Reviews state
  const [reviewsData, setReviewsData] = useState<ReviewsResponse>({
    reviews: [],
    count: 0,
    averageRating: 0,
  });
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const [prod, rev] = await Promise.all([
          productService.getProduct(id),
          reviewService.getProductReviews(id).catch(() => ({ reviews: [], count: 0, averageRating: 0 })),
        ]);
        setProduct(prod);
        setReviewsData(rev);
      } catch {
        toast.error('Product not found');
        navigate('/collection');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  // Check wishlist state
  useEffect(() => {
    if (!user || !id) return;
    userService
      .getWishlist()
      .then((items) => setIsWishlisted(items.some((item) => item._id === id)))
      .catch(() => {});
  }, [user, id]);

  if (loading) return <LoadingScreen />;
  if (!product) return null;

  const images = product.images?.length
    ? product.images.map((img) => getImageUrl(img))
    : ['/placeholder.jpg'];

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }
    setAdding(true);
    await addToCart(product._id, quantity);
    setAdding(false);
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please sign in to save pieces to your wishlist');
      return;
    }
    try {
      if (isWishlisted) {
        await userService.removeFromWishlist(product._id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await userService.addToWishlist(product._id);
        setIsWishlisted(true);
        toast.success('Saved to wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('Please write a comment for your review');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewService.createReview(product._id, {
        rating: ratingVal,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
      });
      toast.success('Review submitted! Thank you.');
      setReviewTitle('');
      setReviewComment('');
      // Reload reviews
      const updatedRev = await reviewService.getProductReviews(product._id);
      setReviewsData(updatedRev);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to submit review';
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const prevImage = () =>
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextImage = () =>
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/collection')}
          className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.2em] uppercase mb-12 flex items-center gap-2 hover:text-[#E8D0A9] transition-colors"
        >
          <ChevronLeft size={16} /> Back to Collection
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Main Image */}
            <div className="relative aspect-[3/4] overflow-hidden mb-4 border border-[#C5A059]/20">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-[#C5A059]/50 bg-[#4A3528]/60 text-[#C5A059] flex items-center justify-center hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-[#C5A059]/50 bg-[#4A3528]/60 text-[#C5A059] flex items-center justify-center hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-20 overflow-hidden border transition-all duration-300 ${
                      i === selectedImage
                        ? 'border-[#C5A059]'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            {product.category && (
              <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-3">
                {product.category}
              </p>
            )}

            <h1 className="font-['Cormorant_Garamond'] font-bold text-4xl md:text-5xl text-[#FDFBF7] mb-3 leading-tight">
              {product.name}
            </h1>

            {/* Review stars summary */}
            {reviewsData.count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-[#C5A059]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={s <= Math.round(reviewsData.averageRating) ? 'fill-[#C5A059]' : 'opacity-30'}
                    />
                  ))}
                </div>
                <span className="font-['Montserrat'] text-xs text-[#FDFBF7]/60">
                  {reviewsData.averageRating} ({reviewsData.count} review{reviewsData.count !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            <div className="h-[1px] w-16 bg-[#C5A059] opacity-60 mb-6" />

            <p className="font-['Cormorant_Garamond'] text-3xl text-[#C5A059] mb-6">
              ₹{product.price.toLocaleString('en-IN')}
            </p>

            {product.description && (
              <p className="font-['Montserrat'] font-light text-[#FDFBF7]/70 text-sm leading-relaxed tracking-wide mb-8 max-w-md">
                {product.description}
              </p>
            )}

            {/* Stock Status */}
            <p className="font-['Montserrat'] text-xs tracking-widest uppercase mb-6">
              {product.stock > 0 ? (
                <span className="text-[#C5A059]">
                  {product.stock <= 5 ? `Only ${product.stock} left in stock` : 'In Stock & Ready to Ship'}
                </span>
              ) : (
                <span className="text-red-400">Sold Out</span>
              )}
            </p>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-6 mb-8">
                <span className="font-['Montserrat'] text-[#FDFBF7]/60 text-xs tracking-widest uppercase">
                  Quantity
                </span>
                <div className="flex items-center border border-[#C5A059]/30">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center font-['Montserrat'] text-[#FDFBF7] text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart & Wishlist Actions */}
            <div className="flex gap-4 items-center">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || adding}
                className="flex-1 md:flex-initial px-10 py-4 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-gradient-to-r hover:from-[#C5A059] hover:to-[#E8D0A9] hover:text-[#4A3528] transition-all duration-400 disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
              >
                {adding ? 'Adding...' : product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                onClick={toggleWishlist}
                className={`p-4 border transition-colors ${
                  isWishlisted
                    ? 'border-red-400 bg-red-400/10 text-red-400'
                    : 'border-[#C5A059]/40 text-[#FDFBF7]/60 hover:text-[#C5A059] hover:border-[#C5A059]'
                }`}
                title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart size={18} className={isWishlisted ? 'fill-red-400' : ''} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* ─── Ratings & Reviews Section ─── */}
        <div className="mt-24 pt-16 border-t border-[#C5A059]/15">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="font-['Montserrat'] text-[#C5A059] text-xs uppercase tracking-[0.3em] mb-2">
                Customer Impressions
              </p>
              <h2 className="font-['Cormorant_Garamond'] text-3xl md:text-4xl font-bold text-[#FDFBF7]">
                Reviews & Ratings
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
              {/* Rating Summary Card */}
              <div className="border border-[#C5A059]/20 p-6 text-center flex flex-col justify-center items-center bg-[#4A3528]/40">
                <span className="font-['Cormorant_Garamond'] text-5xl font-bold text-[#C5A059]">
                  {reviewsData.averageRating || '—'}
                </span>
                <div className="flex text-[#C5A059] my-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      className={s <= Math.round(reviewsData.averageRating) ? 'fill-[#C5A059]' : 'opacity-20'}
                    />
                  ))}
                </div>
                <p className="font-['Montserrat'] text-xs text-[#FDFBF7]/60">
                  Based on {reviewsData.count} review{reviewsData.count !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Review Submission Form */}
              <div className="md:col-span-2 border border-[#C5A059]/20 p-6 bg-[#4A3528]/40">
                <h3 className="font-['Cormorant_Garamond'] text-xl text-[#FDFBF7] mb-4">
                  Write an Atelier Review
                </h3>
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {/* Interactive Star Picker */}
                    <div className="flex items-center gap-2">
                      <span className="font-['Montserrat'] text-xs text-[#FDFBF7]/60 mr-2">Your Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingVal(star)}
                          className="text-[#C5A059] hover:scale-110 transition-transform"
                        >
                          <Star
                            size={18}
                            className={star <= ratingVal ? 'fill-[#C5A059]' : 'opacity-30'}
                          />
                        </button>
                      ))}
                    </div>

                    <input
                      placeholder="Title / Summary (e.g. Masterpiece on my mantle)"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-xs py-2 px-1 focus:outline-none focus:border-[#C5A059] placeholder:text-[#FDFBF7]/30"
                    />

                    <textarea
                      rows={3}
                      placeholder="Share your experience with the craftsmanship and texture..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      className="w-full bg-transparent border border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-xs p-2 focus:outline-none focus:border-[#C5A059] placeholder:text-[#FDFBF7]/30 resize-none"
                    />

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-[11px] uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#4A3528] transition-all disabled:opacity-40"
                    >
                      {submittingReview ? 'Submitting...' : 'Post Review'}
                    </button>
                  </form>
                ) : (
                  <div className="py-6 text-center">
                    <p className="font-['Montserrat'] text-xs text-[#FDFBF7]/60 mb-4">
                      Please sign in to share your thoughts on this piece.
                    </p>
                    <button
                      onClick={() => navigate('/login', { state: { from: { pathname: `/product/${id}` } } })}
                      className="px-6 py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-xs uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
                    >
                      Sign In to Review
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
              {reviewsData.reviews.length === 0 ? (
                <p className="text-center py-8 font-['Montserrat'] text-xs text-[#FDFBF7]/40 tracking-wider">
                  No reviews yet for this piece. Be the first to share your impression!
                </p>
              ) : (
                reviewsData.reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="border-b border-[#C5A059]/10 pb-6 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-['Montserrat'] font-semibold text-xs text-[#FDFBF7]">
                          {rev.userName}
                        </span>
                        {rev.isVerifiedPurchase && (
                          <span className="flex items-center gap-1 font-['Montserrat'] text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 border border-green-400/20">
                            <ShieldCheck size={11} /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="font-['Montserrat'] text-[10px] text-[#FDFBF7]/40">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex text-[#C5A059]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= rev.rating ? 'fill-[#C5A059]' : 'opacity-20'}
                        />
                      ))}
                    </div>

                    {rev.title && (
                      <h4 className="font-['Cormorant_Garamond'] text-lg font-bold text-[#FDFBF7]">
                        {rev.title}
                      </h4>
                    )}

                    <p className="font-['Montserrat'] text-xs text-[#FDFBF7]/70 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
