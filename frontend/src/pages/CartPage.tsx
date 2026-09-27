import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { getImageUrl } from '@/lib/image';

export default function CartPage() {
  const { items, totalPrice, loading, updateQuantity, removeItem } = useCart();

  if (loading) return <LoadingScreen />;

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-4">
            Your Selection
          </p>
          <h1 className="font-['Cormorant_Garamond'] font-bold text-5xl md:text-6xl text-[#FDFBF7]">
            Shopping Cart
          </h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="h-[1px] bg-[#C5A059] mx-auto mt-6 opacity-60"
          />
        </motion.div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <ShoppingBag size={48} className="text-[#C5A059]/30 mx-auto mb-6" strokeWidth={1} />
            <p className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7]/60 mb-8">
              Your cart is empty
            </p>
            <Link
              to="/collection"
              className="inline-block px-10 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-[#C5A059] hover:text-[#4A3528] transition-all duration-300"
            >
              Explore Collection
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-0">
              {items.map((item, index) => (
                <motion.div
                  key={item.product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-6 py-8 border-b border-[#C5A059]/15"
                >
                  {/* Image */}
                  <Link to={`/product/${item.product._id}`} className="shrink-0">
                    <div className="w-20 h-24 md:w-24 md:h-32 overflow-hidden">
                      <img
                        src={getImageUrl(item.product.images?.[0])}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product._id}`}>
                      <h3 className="font-['Cormorant_Garamond'] text-xl md:text-2xl text-[#FDFBF7] hover:text-[#C5A059] transition-colors truncate">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.2em] font-light mt-1">
                      ₹{item.product.price.toLocaleString('en-IN')}
                    </p>

                    {/* Quantity - Mobile */}
                    <div className="flex items-center mt-4 md:hidden">
                      <div className="flex items-center border border-[#C5A059]/30">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product._id,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center text-[#C5A059]"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-10 text-center font-['Montserrat'] text-[#FDFBF7] text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product._id, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center text-[#C5A059]"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quantity - Desktop */}
                  <div className="hidden md:flex items-center border border-[#C5A059]/30">
                    <button
                      onClick={() =>
                        updateQuantity(item.product._id, Math.max(1, item.quantity - 1))
                      }
                      className="w-10 h-10 flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center font-['Montserrat'] text-[#FDFBF7] text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product._id, item.quantity + 1)
                      }
                      className="w-10 h-10 flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <p className="hidden md:block font-['Montserrat'] text-[#FDFBF7] text-sm tracking-wide w-28 text-right">
                    ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </p>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.product._id)}
                    className="text-[#FDFBF7]/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 border-t border-[#C5A059]/30 pt-8"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-['Montserrat'] text-[#FDFBF7]/60 text-xs tracking-[0.2em] uppercase">
                  Total
                </span>
                <span className="font-['Cormorant_Garamond'] text-3xl text-[#C5A059]">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Link
                  to="/collection"
                  className="px-8 py-3 border border-[#FDFBF7]/20 text-[#FDFBF7]/60 font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:border-[#FDFBF7]/40 hover:text-[#FDFBF7] transition-all duration-300 text-center"
                >
                  Continue Shopping
                </Link>
                <Link
                  to="/checkout"
                  className="px-10 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-gradient-to-r hover:from-[#C5A059] hover:to-[#E8D0A9] hover:text-[#4A3528] transition-all duration-400 text-center"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
