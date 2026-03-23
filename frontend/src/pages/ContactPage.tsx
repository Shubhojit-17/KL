import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-4">
            We Are Here To Help
          </p>
          <h1 className="font-['Cormorant_Garamond'] font-bold text-5xl md:text-6xl text-[#FDFBF7]">
            Contact Us
          </h1>
          <div className="h-[1px] w-20 bg-[#C5A059] mx-auto mt-6 opacity-60" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-[#C5A059]/20 p-8 space-y-6"
          >
            <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#FDFBF7]">
              Customer Support
            </h2>
            <p className="font-['Montserrat'] text-[#FDFBF7]/70 text-sm leading-relaxed">
              For order updates, product questions, shipping support, or custom requests,
              contact our team and we will respond as quickly as possible.
            </p>

            <div className="space-y-4">
              <a
                href="mailto:support@klvase.com"
                className="flex items-center gap-3 text-[#FDFBF7] hover:text-[#C5A059] transition-colors"
              >
                <Mail size={16} />
                <span className="font-['Montserrat'] text-sm tracking-wide">support@klvase.com</span>
              </a>
              <a
                href="tel:+919876543210"
                className="flex items-center gap-3 text-[#FDFBF7] hover:text-[#C5A059] transition-colors"
              >
                <Phone size={16} />
                <span className="font-['Montserrat'] text-sm tracking-wide">+91 98765 43210</span>
              </a>
              <div className="flex items-center gap-3 text-[#FDFBF7]/80">
                <MapPin size={16} />
                <span className="font-['Montserrat'] text-sm tracking-wide">
                  KL Vase Atelier, Kolkata, West Bengal, India
                </span>
              </div>
              <div className="flex items-center gap-3 text-[#FDFBF7]/80">
                <Clock size={16} />
                <span className="font-['Montserrat'] text-sm tracking-wide">
                  Mon - Sat, 10:00 AM - 7:00 PM IST
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-[#C5A059]/20 p-8"
          >
            <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#FDFBF7] mb-6">
              Send A Message
            </h2>
            <form className="space-y-5">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-3 px-1 focus:outline-none focus:border-[#C5A059] placeholder:text-[#FDFBF7]/30"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-3 px-1 focus:outline-none focus:border-[#C5A059] placeholder:text-[#FDFBF7]/30"
              />
              <textarea
                rows={5}
                placeholder="Your Message"
                className="w-full bg-transparent border border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-3 px-3 focus:outline-none focus:border-[#C5A059] placeholder:text-[#FDFBF7]/30 resize-none"
              />
              <button
                type="button"
                className="px-8 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
              >
                Submit Inquiry
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
