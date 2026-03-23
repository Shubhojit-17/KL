import { Link } from 'react-router';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccessPage() {
  return (
    <section className="py-24 md:py-32 bg-[#4A3528] px-6 min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="mx-auto mb-8"
        >
          <CheckCircle size={64} className="text-[#C5A059] mx-auto" strokeWidth={1} />
        </motion.div>

        <h1 className="font-['Cormorant_Garamond'] font-bold text-4xl md:text-5xl text-[#FDFBF7] mb-4">
          Order Confirmed
        </h1>

        <div className="h-[1px] w-16 bg-[#C5A059] mx-auto opacity-60 mb-6" />

        <p className="font-['Montserrat'] font-light text-[#FDFBF7]/70 text-sm tracking-wide leading-relaxed mb-10">
          Thank you for your purchase. Your curated selection is being prepared with care.
          You will receive a confirmation shortly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/orders"
            className="px-10 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-[#C5A059] hover:text-[#4A3528] transition-all duration-300"
          >
            View Orders
          </Link>
          <Link
            to="/collection"
            className="px-10 py-3 border border-[#FDFBF7]/20 text-[#FDFBF7]/60 font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:border-[#FDFBF7]/40 hover:text-[#FDFBF7] transition-all duration-300"
          >
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
