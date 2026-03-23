import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import heroImg from '@/assets/hero-1.png';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function LoginContent() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      await login(credentialResponse.credential);
      toast.success('Welcome to the Atelier');
      navigate(from, { replace: true });
    } catch {
      toast.error('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side – Hero Image (60%) */}
      <div className="hidden lg:block lg:w-[60%] relative overflow-hidden">
        <motion.div
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0"
        >
          <img
            src={heroImg}
            alt="Luxury Artisan"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#4A3528]/40 via-transparent to-[#F9F7F2]/10" />

        {/* Overlay text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.2 }}
          className="absolute bottom-16 left-12 max-w-md"
        >
          <p className="font-['Montserrat'] text-[#FDFBF7]/60 text-xs tracking-[0.3em] uppercase mb-4">
            Since 2024
          </p>
          <h2 className="font-['Cormorant_Garamond'] text-4xl text-[#FDFBF7] leading-tight">
            Artistry Formed in <br />
            Earth & Fire
          </h2>
        </motion.div>
      </div>

      {/* Right Side – Login Form (40%) */}
      <div className="w-full lg:w-[40%] bg-[#F9F7F2] flex items-center justify-center px-8 py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-sm flex flex-col items-center text-center"
        >
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#2D1B14] mb-4 leading-tight"
          >
            Welcome to <br /> the Atelier
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 64 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="h-[1px] bg-[#C5A059] mb-6"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="font-['Montserrat'] text-[#2D1B14]/60 text-sm tracking-wide mb-12 font-light"
          >
            Continue your curated experience.
          </motion.p>

          {/* Google Sign In – Custom styled wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="w-full"
          >
            {/* Hidden Google button + custom overlay */}
            <div className="relative">
              <div className="opacity-0 absolute inset-0 z-10 overflow-hidden" style={{ height: 50 }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google sign-in failed')}
                  width="320"
                  size="large"
                />
              </div>
              <button
                className="w-full py-3.5 border border-[#C5A059] text-[#2D1B14] font-['Montserrat'] text-xs tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-[#2D1B14] transition-all duration-400 flex items-center justify-center gap-3 relative z-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#C5A059"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#C5A059"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#C5A059"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#C5A059"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </motion.div>

          {/* Trust text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="mt-8 font-['Montserrat'] text-[#2D1B14]/40 text-[10px] tracking-widest uppercase"
          >
            Secure &middot; Private &middot; Encrypted
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
