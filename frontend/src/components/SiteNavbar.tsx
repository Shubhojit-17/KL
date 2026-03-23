import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Menu, X, ShoppingBag, User, LogOut, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import logoImg from '@/assets/logoKL.jpeg';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
  };

  const links = [
    { name: 'Home', id: 'hero', to: '/' },
    { name: 'Collection', id: 'collection', to: '/collection' },
    { name: 'Orders', to: '/orders' },
    { name: 'Story', id: 'story' },
    { name: 'Craft', id: 'craft' },
    { name: 'Contact', to: '/contact' },
  ];

  return (
    <nav
      className={clsx(
        'fixed top-0 left-0 w-full z-50 transition-colors duration-500 py-6 px-6 md:px-12 flex justify-between items-center',
        scrolled ? 'bg-[#4A3528] shadow-lg' : 'bg-transparent'
      )}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center">
        <img
          src={logoImg}
          alt="Brand Logo"
          className="h-10 md:h-12 w-auto max-w-[120px] md:max-w-[150px] object-contain rounded-sm"
        />
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center space-x-10">
        {links.map((link) =>
          link.to && link.to !== '/' ? (
            <Link
              key={link.name}
              to={link.to}
              className="text-[#FDFBF7] font-['Montserrat'] text-sm tracking-widest uppercase hover:text-[#C5A059] transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#C5A059] transition-all duration-300 group-hover:w-full" />
            </Link>
          ) : (
            <button
              key={link.name}
              onClick={() => {
                if (link.to === '/') {
                  navigate('/');
                  return;
                }
                if (link.id) {
                  handleNavClick(link.id);
                }
              }}
              className="text-[#FDFBF7] font-['Montserrat'] text-sm tracking-widest uppercase hover:text-[#C5A059] transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#C5A059] transition-all duration-300 group-hover:w-full" />
            </button>
          )
        )}

        {/* Cart */}
        <Link to="/cart" className="relative text-[#FDFBF7] hover:text-[#C5A059] transition-colors">
          <ShoppingBag size={20} strokeWidth={1.5} />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#C5A059] text-[#4A3528] text-[9px] font-['Montserrat'] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>

        {/* User Menu */}
        {user ? (
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="text-[#C5A059] hover:text-[#E8D0A9] transition-colors"
                title="Admin Panel"
              >
                <Shield size={18} strokeWidth={1.5} />
              </Link>
            )}
            <Link
              to="/orders"
              className="text-[#FDFBF7] hover:text-[#C5A059] transition-colors"
              title="My Orders"
            >
              <User size={18} strokeWidth={1.5} />
            </Link>
            <button
              onClick={logout}
              className="text-[#FDFBF7]/60 hover:text-[#FDFBF7] transition-colors"
              title="Logout"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="font-['Montserrat'] text-xs tracking-[0.15em] uppercase border border-[#C5A059] text-[#C5A059] px-5 py-2 hover:bg-[#C5A059] hover:text-[#4A3528] transition-all duration-300"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="flex md:hidden items-center gap-4">
        <Link to="/cart" className="relative text-[#FDFBF7] hover:text-[#C5A059] transition-colors">
          <ShoppingBag size={22} strokeWidth={1.5} />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#C5A059] text-[#4A3528] text-[9px] font-['Montserrat'] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
        <button className="text-[#C5A059]" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={28} />
        </button>
      </div>

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
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (link.to) navigate(link.to);
                    else if (link.id) handleNavClick(link.id);
                  }}
                  className="text-[#FDFBF7] font-['Cormorant_Garamond'] text-3xl font-bold hover:text-[#C5A059] transition-colors"
                >
                  {link.name}
                </button>
              ))}

              {user ? (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#C5A059] font-['Cormorant_Garamond'] text-2xl"
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[#C5A059] font-['Cormorant_Garamond'] text-2xl"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="text-[#FDFBF7]/60 font-['Montserrat'] text-sm uppercase tracking-widest"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#C5A059] font-['Cormorant_Garamond'] text-3xl font-bold"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
