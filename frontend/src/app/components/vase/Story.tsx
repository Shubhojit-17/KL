import { motion } from 'motion/react';
import logoImg from '@/assets/logoKL.jpeg';
import vase5Img from '@/assets/vase 5.png';

export function Story() {
  return (
    <section id="story" className="relative py-16 md:py-24 bg-[#4A3528] overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <motion.img 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.03 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
          src={logoImg} 
          className="w-[120%] md:w-[60%] opacity-5 blur-sm select-none" 
          alt="" 
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left Image */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden relative group"
        >
          <div className="absolute inset-0 bg-[#C5A059]/10 z-10 group-hover:bg-transparent transition-colors duration-700" />
          <img src={vase5Img} loading="lazy" className="w-full h-full object-cover transition-transform duration-1000 scale-100 group-hover:scale-105" alt="Craftsmanship" />
          <div className="absolute inset-0 border border-[#C5A059]/30 m-6 md:m-8 z-20 pointer-events-none" />
        </motion.div>

        {/* Right Text */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center md:text-left space-y-6 md:pl-8"
        >
          <h2 className="font-['Cormorant_Garamond'] font-bold text-4xl md:text-5xl lg:text-6xl text-[#FDFBF7] leading-[0.9]">
            The Heritage <br/> of Form
          </h2>
          <div className="h-[1px] w-24 bg-[#C5A059] mx-auto md:mx-0 opacity-60" />
          <p className="font-['Montserrat'] font-light text-base md:text-lg text-[#FDFBF7]/80 leading-loose max-w-lg mx-auto md:mx-0 tracking-wide">
            Every curve tells a story of ancient earth meeting modern vision. Our artisans dedicate weeks to shaping each piece, honoring traditions that have been passed down through generations.
          </p>
          <p className="font-['Montserrat'] font-light text-base md:text-lg text-[#FDFBF7]/80 leading-loose max-w-lg mx-auto md:mx-0 tracking-wide">
            We believe that true luxury lies in the patience of creation. The subtle imperfections are not flaws, but signatures of the human hand—making each vessel distinctly unique.
          </p>
          
          <button className="inline-block mt-8 border-b border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-xs uppercase tracking-[0.2em] hover:text-[#FDFBF7] hover:border-[#FDFBF7] transition-all duration-400 pb-2 pt-4">
            Read Our Story
          </button>
        </motion.div>
      </div>
    </section>
  );
}
