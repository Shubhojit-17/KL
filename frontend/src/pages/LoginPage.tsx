import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import heroImg from '@/assets/hero-1.png';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function LoginContent() {
  const { user, login, loginWithPassword, registerWithPassword, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const [authMode, setAuthMode] = useState<'google' | 'login' | 'register'>('google');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (authMode === 'register') {
        if (!name.trim()) {
          toast.error('Name is required');
          return;
        }
        await registerWithPassword(name.trim(), email.trim(), password);
        toast.success('Welcome to KL Vase Atelier');
      } else {
        await loginWithPassword(email.trim(), password);
        toast.success('Welcome back');
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Authentication failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
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

      {/* Right Side – Auth Form (40%) */}
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
            className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#2D1B14] mb-3 leading-tight"
          >
            {authMode === 'register' ? 'Join the Atelier' : 'Welcome to the Atelier'}
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 64 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="h-[1px] bg-[#C5A059] mb-4"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="font-['Montserrat'] text-[#2D1B14]/60 text-xs tracking-wide mb-8 font-light"
          >
            {authMode === 'register'
              ? 'Create an account to track orders & save curated pieces'
              : 'Continue your curated experience'}
          </motion.p>

          {/* Mode Switcher – Luxury Segmented Pill Controls */}
          <div className="w-full max-w-sm mb-8">
            <div className="grid grid-cols-3 p-1.5 bg-[#F2EFE9] border border-[#C5A059]/40 rounded-full shadow-inner gap-1">
              <button
                type="button"
                onClick={() => setAuthMode('google')}
                className={`py-2 px-3 rounded-full font-['Montserrat'] text-[11px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  authMode === 'google'
                    ? 'bg-[#4A3528] text-[#FDFBF7] shadow-sm font-semibold'
                    : 'text-[#2D1B14]/60 hover:text-[#2D1B14] hover:bg-[#EAE5DC]'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 px-3 rounded-full font-['Montserrat'] text-[11px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-[#4A3528] text-[#FDFBF7] shadow-sm font-semibold'
                    : 'text-[#2D1B14]/60 hover:text-[#2D1B14] hover:bg-[#EAE5DC]'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`py-2 px-3 rounded-full font-['Montserrat'] text-[11px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-[#4A3528] text-[#FDFBF7] shadow-sm font-semibold'
                    : 'text-[#2D1B14]/60 hover:text-[#2D1B14] hover:bg-[#EAE5DC]'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Register
              </button>
            </div>
          </div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {authMode === 'google' ? (
              <motion.div
                key="google"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
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
                    className="w-full py-3.5 bg-white border border-[#C5A059]/60 rounded-xl text-[#2D1B14] font-['Montserrat'] text-xs tracking-[0.15em] uppercase hover:bg-[#F2EFE9] hover:border-[#C5A059] shadow-sm transition-all duration-300 flex items-center justify-center gap-3 relative z-0"
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
            ) : (
              <motion.form
                key="password"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handlePasswordSubmit}
                className="w-full space-y-4 text-left"
              >
                {authMode === 'register' && (
                  <div>
                    <label className="block font-['Montserrat'] text-[10px] uppercase tracking-widest text-[#2D1B14]/70 mb-1.5 font-medium">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Eleanor Vance"
                      className="w-full bg-white/70 border border-[#C5A059]/40 rounded-xl text-[#2D1B14] font-['Montserrat'] text-xs py-2.5 px-3.5 focus:outline-none focus:border-[#C5A059] focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-['Montserrat'] text-[10px] uppercase tracking-widest text-[#2D1B14]/70 mb-1.5 font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-white/70 border border-[#C5A059]/40 rounded-xl text-[#2D1B14] font-['Montserrat'] text-xs py-2.5 px-3.5 focus:outline-none focus:border-[#C5A059] focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-['Montserrat'] text-[10px] uppercase tracking-widest text-[#2D1B14]/70 mb-1.5 font-medium">
                    Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full bg-white/70 border border-[#C5A059]/40 rounded-xl text-[#2D1B14] font-['Montserrat'] text-xs py-2.5 px-3.5 focus:outline-none focus:border-[#C5A059] focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-5 py-3.5 bg-[#4A3528] text-[#FDFBF7] rounded-xl font-['Montserrat'] text-xs tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-[#4A3528] transition-all duration-300 disabled:opacity-40 font-semibold shadow-md"
                >
                    {submitting
                    ? 'Processing...'
                    : authMode === 'register'
                    ? 'Create Atelier Account'
                    : 'Sign In'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

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
