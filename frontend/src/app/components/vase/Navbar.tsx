import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import logoImg from '@/assets/logoKL.jpeg';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const links = [
    { name: 'Home', id: 'hero' },
    { name: 'Collection', id: 'collection' },
    { name: 'Story', id: 'story' },
    { name: 'Craft', id: 'craft' },
    { name: 'Contact', id: 'contact' },
  ];

  return (
    <nav
      className={clsx(
        'fixed top-0 left-0 w-full z-50 transition-colors duration-500 py-6 px-6 md:px-12 flex justify-between items-center',
        scrolled ? 'bg-[#4A3528] shadow-lg' : 'bg-transparent'
      )}
    >
      <div className="flex items-center">
        <img src={logoImg} alt="Brand Logo" className="h-10 md:h-12 w-auto max-w-[120px] md:max-w-[150px] object-contain rounded-sm" />
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex space-x-12">
        {links.map((link) => (
          <button
            key={link.name}
            onClick={() => scrollToSection(link.id)}
            className="text-[#FDFBF7] font-['Montserrat'] text-sm tracking-widest uppercase hover:text-[#C5A059] transition-colors relative group"
          >
            {link.name}
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#C5A059] transition-all duration-300 group-hover:w-full"></span>
          </button>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-[#C5A059]"
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu size={28} />
      </button>

      {/* Mobile Full Screen Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#4A3528] z-50 flex flex-col items-center justify-center"
          >
            <button
              className="absolute top-6 right-6 text-[#C5A059]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={32} />
            </button>

            <div className="flex flex-col space-y-8 items-center">
              {links.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.id)}
                  className="text-[#FDFBF7] font-['Cormorant_Garamond'] text-3xl font-bold hover:text-[#C5A059] transition-colors"
                >
                  {link.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
