import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { contactService } from '@/services/contact.service';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await contactService.submitInquiry({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      toast.success('Thank you for reaching out. We will get back to you shortly.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

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
              For order updates, product inquiries, bespoke commissions, or shipping inquiries,
              reach out to our atelier team and we will respond within 24 hours.
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name *"
                required
                className="w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-3 px-1 focus:outline-none focus:border-[#C5A059] placeholder:text-[#FDFBF7]/30"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address *"
                required
                className="w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-3 px-1 focus:outline-none focus:border-[#C5A059] placeholder:text-[#FDFBF7]/30"
              />
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your Message *"
                required
                className="w-full bg-transparent border border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-3 px-3 focus:outline-none focus:border-[#C5A059] placeholder:text-[#FDFBF7]/30 resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-[#C5A059] hover:text-[#4A3528] transition-all flex items-center gap-2 disabled:opacity-40"
              >
                <Send size={14} /> {submitting ? 'Sending...' : 'Submit Inquiry'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
