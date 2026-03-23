import { motion } from 'motion/react';

export function Divider() {
  return (
    <div className="w-full flex justify-center py-12 md:py-24 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: '100%' }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        viewport={{ once: true }}
        className="h-[1px] bg-[#C5A059] max-w-7xl mx-auto opacity-60"
      />
    </div>
  );
}
