import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { productService, type Product } from '@/services/product.service';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function CollectionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await productService.getProducts({ limit: 50 });
        setProducts(data.products ?? []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-4">
            Curated Selection
          </p>
          <h1 className="font-['Cormorant_Garamond'] font-bold text-5xl md:text-6xl text-[#FDFBF7] tracking-wide">
            The Collection
          </h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-[1px] bg-[#C5A059] mx-auto mt-6 opacity-60"
          />
        </motion.div>

        {products.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center font-['Montserrat'] text-[#FDFBF7]/60 text-lg"
          >
            No pieces available at the moment.
          </motion.p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.8, delay: index * 0.05, ease: 'easeOut' }}
              >
                <Link
                  to={`/product/${product._id}`}
                  className="group flex flex-col items-center"
                >
                  <div className="w-full aspect-[3/4] overflow-hidden relative border border-transparent transition-all duration-500 group-hover:border-[#C5A059]/30 group-hover:shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                    <img
                      src={product.images?.[0] || '/placeholder.jpg'}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    />
                  </div>

                  <div className="mt-4 text-center w-full flex flex-col items-center space-y-2">
                    <h3 className="font-['Cormorant_Garamond'] font-bold text-xl md:text-2xl text-[#FDFBF7]">
                      {product.name}
                    </h3>
                    <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.2em] font-light">
                      ₹{product.price.toLocaleString('en-IN')}
                    </p>

                    <span className="mt-2 px-6 py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-[10px] uppercase tracking-widest hover:bg-gradient-to-r hover:from-[#C5A059] hover:to-[#E8D0A9] hover:text-[#4A3528] transition-all duration-400 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transform">
                      View Details
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
