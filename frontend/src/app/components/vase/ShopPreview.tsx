import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { productService, type Product } from '@/services/product.service';

export function ShopPreview() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await productService.getProducts({ limit: 4, sort: 'newest' });
        setProducts(data.products ?? []);
      } catch {
        setProducts([]);
      }
    };

    fetch();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6">
      <div className="max-w-5xl mx-auto flex flex-col items-center">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#FDFBF7] text-center mb-14"
        >
          Explore the Atelier
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full mb-14">
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="group cursor-pointer flex flex-col items-center"
            >
              <Link to={`/product/${product._id}`} className="w-full flex flex-col items-center">
                <div className="w-full overflow-hidden aspect-[3/4] mb-4 relative border border-transparent transition-all duration-500 group-hover:border-[#C5A059]/30">
                   <div className="absolute inset-0 bg-[#4A3528]/20 group-hover:bg-transparent transition-all z-10 duration-500" />
                   <img src={product.images?.[0] || '/placeholder.jpg'} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                </div>
                <h3 className="text-center font-['Cormorant_Garamond'] text-lg md:text-xl text-[#FDFBF7] group-hover:text-[#C5A059] transition-colors duration-300">{product.name}</h3>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="transform hover:scale-105"
        >
          <Link
            to="/collection"
            className="px-10 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-gradient-to-r hover:from-[#C5A059] hover:to-[#E8D0A9] hover:text-[#4A3528] transition-all duration-400 inline-block"
          >
            View Full Collection
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
