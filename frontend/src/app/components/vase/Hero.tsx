import { motion } from 'motion/react';
import heroImg from '@/assets/hero-1.png';

export function Hero() {
  return (
    <section id="hero" className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-[#4A3528]">
      {/* Background Image */}
      <motion.div 
        initial={{ scale: 1 }}
        animate={{ scale: 1.03 }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={heroImg} 
          alt="Hero Background" 
          className="w-full h-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#4A3528]/60 via-[#4A3528]/30 to-[#4A3528]" />
        <div className="absolute inset-0 bg-[#4A3528]/20" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="font-['Cormorant_Garamond'] font-bold text-5xl md:text-7xl lg:text-8xl text-[#FDFBF7] mb-8 leading-[1.1]"
        >
          Artistry Formed in <br className="md:hidden" /> Earth & Fire
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
          className="font-['Montserrat'] font-light text-lg md:text-xl text-[#FDFBF7]/90 mb-12 tracking-wide max-w-2xl mx-auto"
        >
          Timeless forms sculpted for modern sanctuaries.
        </motion.p>
        
        <motion.button 
          onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, delay: 1.0, ease: "easeOut" }}
          className="px-10 py-4 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs md:text-sm hover:bg-gradient-to-r hover:from-[#C5A059] hover:to-[#E8D0A9] hover:text-[#4A3528] transition-all duration-400 cursor-pointer"
        >
          Discover the Collection
        </motion.button>
      </div>
    </section>
  );
}
