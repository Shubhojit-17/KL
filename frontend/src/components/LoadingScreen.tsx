import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#4A3528] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border border-[#C5A059] border-t-transparent rounded-full"
        />
        <p className="font-['Montserrat'] text-[#FDFBF7]/60 text-xs tracking-[0.3em] uppercase">
          Loading
        </p>
      </motion.div>
    </div>
  );
}
