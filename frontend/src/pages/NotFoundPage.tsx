import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20">
      <h1
        className="text-7xl font-bold tracking-wider"
        style={{ color: '#C5A059', fontFamily: 'Playfair Display, serif' }}
      >
        404
      </h1>
      <p
        className="mt-4 text-lg tracking-widest uppercase"
        style={{ color: '#FDFBF7', fontFamily: 'Montserrat, sans-serif', opacity: 0.8 }}
      >
        Page not found
      </p>
      <p
        className="mt-2 text-sm max-w-md"
        style={{ color: '#FDFBF7', fontFamily: 'Montserrat, sans-serif', opacity: 0.5 }}
      >
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-block px-8 py-3 text-xs uppercase tracking-[0.2em] border transition-all duration-300 hover:bg-[#C5A059] hover:text-[#4A3528] hover:border-[#C5A059]"
        style={{
          color: '#C5A059',
          borderColor: 'rgba(197, 160, 89, 0.5)',
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        Return Home
      </Link>
    </div>
  );
}
