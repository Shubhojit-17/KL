import { Link } from 'react-router';

export function SiteFooter() {
  return (
    <footer className="bg-[#4A3528]">
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-[#FDFBF7]/10 flex flex-col md:flex-row justify-between items-center text-[#FDFBF7]/30 text-xs font-['Montserrat'] tracking-widest uppercase">
        <p>&copy; 2026 Vase Brand. All Rights Reserved.</p>
        <div className="flex space-x-8 mt-6 md:mt-0">
          <Link to="/" className="hover:text-[#C5A059] transition-colors">
            Home
          </Link>
          <Link to="/collection" className="hover:text-[#C5A059] transition-colors">
            Shop
          </Link>
          <Link to="/contact" className="hover:text-[#C5A059] transition-colors">
            Contact
          </Link>
          <a href="#" className="hover:text-[#C5A059] transition-colors">
            Instagram
          </a>
          <a href="#" className="hover:text-[#C5A059] transition-colors">
            Pinterest
          </a>
        </div>
      </div>
    </footer>
  );
}
