import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Menu, X, ShoppingBag, User, LogOut, Shield, Search, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import logoImg from '@/assets/logoKL.jpeg';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const isHome = location.pathname === '/';

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    setMobileMenuOpen(false);
    navigate(`/collection?search=${encodeURIComponent(searchQuery.trim())}`);
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
        'fixed top-0 left-0 w-full z-50 transition-colors duration-500 py-5 px-6 md:px-12 flex justify-between items-center',
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
      <div className="hidden md:flex items-center space-x-8">
        {links.map((link) =>
          link.to && link.to !== '/' ? (
            <Link
              key={link.name}
              to={link.to}
              className="text-[#FDFBF7] font-['Montserrat'] text-xs tracking-widest uppercase hover:text-[#C5A059] transition-colors relative group"
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
              className="text-[#FDFBF7] font-['Montserrat'] text-xs tracking-widest uppercase hover:text-[#C5A059] transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#C5A059] transition-all duration-300 group-hover:w-full" />
            </button>
          )
        )}

        {/* Search Toggle */}
        <div className="relative">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collection..."
                className="w-48 bg-[#4A3528] border-b border-[#C5A059] text-[#FDFBF7] font-['Montserrat'] text-xs py-1 px-2 focus:outline-none placeholder:text-[#FDFBF7]/40"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-[#FDFBF7]/50 hover:text-[#FDFBF7] ml-2"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="text-[#FDFBF7] hover:text-[#C5A059] transition-colors"
              title="Search collection"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Wishlist Link (if logged in) */}
        {user && (
          <Link
            to="/profile"
            className="text-[#FDFBF7] hover:text-[#C5A059] transition-colors"
            title="Saved Items / Wishlist"
          >
            <Heart size={18} strokeWidth={1.5} />
          </Link>
        )}

        {/* Cart */}
        <Link to="/cart" className="relative text-[#FDFBF7] hover:text-[#C5A059] transition-colors">
          <ShoppingBag size={19} strokeWidth={1.5} />
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
                title="Admin Dashboard"
              >
                <Shield size={18} strokeWidth={1.5} />
              </Link>
            )}
            <Link
              to="/profile"
              className="text-[#FDFBF7] hover:text-[#C5A059] transition-colors"
              title="Profile & Addresses"
            >
              <User size={18} strokeWidth={1.5} />
            </Link>
            <button
              onClick={logout}
              className="text-[#FDFBF7]/60 hover:text-[#FDFBF7] transition-colors"
              title="Logout"
            >
              <LogOut size={17} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="font-['Montserrat'] text-xs tracking-[0.15em] uppercase border border-[#C5A059] text-[#C5A059] px-5 py-2 hover:bg-[#C5A059] hover:text-[#4A3528] transition-all duration-300 font-medium"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="flex md:hidden items-center gap-4">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="text-[#FDFBF7] hover:text-[#C5A059]"
        >
          <Search size={20} strokeWidth={1.5} />
        </button>
        <Link to="/cart" className="relative text-[#FDFBF7] hover:text-[#C5A059] transition-colors">
          <ShoppingBag size={20} strokeWidth={1.5} />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#C5A059] text-[#4A3528] text-[9px] font-['Montserrat'] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
        <button className="text-[#C5A059]" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={26} />
        </button>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#4A3528] border-b border-[#C5A059]/30 p-4 z-40">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vases, ceramics..."
              className="flex-1 bg-transparent border-b border-[#C5A059] text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#C5A059] text-[#4A3528] font-['Montserrat'] text-xs uppercase tracking-wider font-semibold"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Full Screen Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#4A3528] z-50 flex flex-col items-center justify-center p-6"
          >
            <button
              className="absolute top-6 right-6 text-[#C5A059]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={30} />
            </button>

            <div className="flex flex-col space-y-6 items-center w-full max-w-xs">
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

              <div className="w-full h-[1px] bg-[#C5A059]/20 my-2" />

              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#C5A059] font-['Cormorant_Garamond'] text-2xl"
                  >
                    My Profile & Wishlist
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#FDFBF7] font-['Cormorant_Garamond'] text-2xl"
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[#C5A059] font-['Cormorant_Garamond'] text-2xl flex items-center gap-2"
                    >
                      <Shield size={20} /> Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="text-[#FDFBF7]/60 font-['Montserrat'] text-xs uppercase tracking-widest pt-4"
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
