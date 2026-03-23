import { motion } from 'motion/react';
import { Hammer, Flame, Gem } from 'lucide-react';

export function Craftsmanship() {
  const steps = [
    { icon: Hammer, title: "Hand Sculpted", desc: "Shaped by master artisans with decades of experience." },
    { icon: Flame, title: "Kiln Fired", desc: "Tempered in extreme heat to ensure lasting durability." },
    { icon: Gem, title: "Gold Finished", desc: "Accented with genuine 24k gold leaf details." },
  ];

  return (
    <section id="craft" className="py-16 md:py-24 bg-[#4A3528] relative z-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="flex flex-col items-center group p-8 hover:bg-[#FDFBF7]/[0.02] transition-colors duration-500 rounded-sm"
            >
              <div className="w-20 h-20 rounded-full border border-[#C5A059] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-[#C5A059] group-hover:text-[#4A3528] text-[#C5A059] transition-all duration-500">
                <step.icon size={32} strokeWidth={1} />
              </div>
              <h3 className="font-['Cormorant_Garamond'] text-3xl text-[#FDFBF7] mb-4 tracking-wide">{step.title}</h3>
              <p className="font-['Montserrat'] font-light text-[#FDFBF7]/70 leading-relaxed max-w-xs text-sm tracking-wide">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
