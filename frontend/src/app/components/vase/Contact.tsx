import { motion } from 'motion/react';
import { Divider } from './Divider';

export function Contact() {
  return (
    <section id="contact" className="bg-[#4A3528] pb-12 pt-0">
      <Divider />
      
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-36 text-center space-y-12">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-['Cormorant_Garamond'] text-5xl md:text-6xl text-[#FDFBF7]"
        >
          Get in Touch
        </motion.h2>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <p className="font-['Montserrat'] text-[#FDFBF7]/60 text-lg font-light tracking-wide">
            For inquiries, commissions, or just to say hello.
          </p>
          <a href="mailto:hello@vasebrand.com" className="block font-['Cormorant_Garamond'] text-3xl md:text-5xl text-[#C5A059] hover:text-[#E8D0A9] transition-colors decoration-[#C5A059] underline underline-offset-8 decoration-1">
            hello@vasebrand.com
          </a>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-[#FDFBF7]/10 flex flex-col md:flex-row justify-between items-center text-[#FDFBF7]/30 text-xs font-['Montserrat'] tracking-widest uppercase">
         <p>&copy; 2026 Vase Brand. All Rights Reserved.</p>
         <div className="flex space-x-8 mt-6 md:mt-0">
           <a href="#" className="hover:text-[#C5A059] transition-colors">Instagram</a>
           <a href="#" className="hover:text-[#C5A059] transition-colors">Pinterest</a>
           <a href="#" className="hover:text-[#C5A059] transition-colors">Twitter</a>
         </div>
      </div>
    </section>
  );
}
