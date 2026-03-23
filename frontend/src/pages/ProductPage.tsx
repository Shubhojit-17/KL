import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { productService, type Product } from '@/services/product.service';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';
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

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const data = await productService.getProduct(id);
        setProduct(data);
      } catch {
        toast.error('Product not found');
        navigate('/collection');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  if (loading) return <LoadingScreen />;
  if (!product) return null;

  const images = product.images?.length ? product.images : ['/placeholder.jpg'];

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }
    setAdding(true);
    await addToCart(product._id, quantity);
    setAdding(false);
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
            <div className="relative aspect-[3/4] overflow-hidden mb-4">
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
              <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-4">
                {product.category}
              </p>
            )}

            <h1 className="font-['Cormorant_Garamond'] font-bold text-4xl md:text-5xl text-[#FDFBF7] mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="h-[1px] w-16 bg-[#C5A059] opacity-60 mb-6" />

            <p className="font-['Cormorant_Garamond'] text-3xl text-[#C5A059] mb-8">
              ₹{product.price.toLocaleString('en-IN')}
            </p>

            {product.description && (
              <p className="font-['Montserrat'] font-light text-[#FDFBF7]/70 text-sm leading-relaxed tracking-wide mb-10 max-w-md">
                {product.description}
              </p>
            )}

            {/* Stock Status */}
            <p className="font-['Montserrat'] text-xs tracking-widest uppercase mb-6">
              {product.stock > 0 ? (
                <span className="text-[#C5A059]">
                  {product.stock <= 5 ? `Only ${product.stock} left` : 'In Stock'}
                </span>
              ) : (
                <span className="text-red-400">Out of Stock</span>
              )}
            </p>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-6 mb-10">
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

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || adding}
              className="w-full md:w-auto px-12 py-4 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-gradient-to-r hover:from-[#C5A059] hover:to-[#E8D0A9] hover:text-[#4A3528] transition-all duration-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding...' : product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
