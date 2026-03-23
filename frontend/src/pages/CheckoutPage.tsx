import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Shield, Lock, CreditCard } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { paymentService } from '@/services/payment.service';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ShippingForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, refreshCart } = useCart();
  const checkoutAttemptKey = useRef<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState<ShippingForm>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    // Validate form
    const required: (keyof ShippingForm)[] = [
      'fullName',
      'phone',
      'addressLine1',
      'city',
      'state',
      'pincode',
    ];
    for (const field of required) {
      if (!form[field].trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setProcessing(true);
    try {
      if (!checkoutAttemptKey.current) {
        checkoutAttemptKey.current = uuidv4();
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway');
        setProcessing(false);
        return;
      }

      const orderData = await paymentService.createOrder(
        {
          fullName: form.fullName,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || undefined,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        checkoutAttemptKey.current
      );

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        order_id: orderData.razorpayOrderId,
        name: 'Luxury Atelier',
        description: 'Payment for your curated selection',
        handler: async (response: any) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            checkoutAttemptKey.current = null;
            await refreshCart();
            navigate('/order-success', { replace: true });
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: form.fullName,
          contact: form.phone,
        },
        theme: {
          color: '#C5A059',
        },
        modal: {
          ondismiss: () => {
            checkoutAttemptKey.current = null;
            setProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create order');
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="py-24 bg-[#4A3528] px-6 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7]/60 mb-6">
            Nothing to checkout
          </p>
          <button
            onClick={() => navigate('/collection')}
            className="px-10 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
          >
            Browse Collection
          </button>
        </motion.div>
      </section>
    );
  }

  const inputClass =
    'w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-["Montserrat"] text-sm py-3 px-1 focus:outline-none focus:border-[#C5A059] transition-colors placeholder:text-[#FDFBF7]/30 tracking-wide';

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-4">
            Final Step
          </p>
          <h1 className="font-['Cormorant_Garamond'] font-bold text-5xl md:text-6xl text-[#FDFBF7]">
            Checkout
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Shipping Form – 3 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-8"
          >
            <h2 className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7] mb-6">
              Shipping Address
            </h2>

            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className={inputClass}
            />

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className={inputClass}
            />

            <input
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              placeholder="Address Line 1"
              className={inputClass}
            />

            <input
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="Address Line 2 (Optional)"
              className={inputClass}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                className={inputClass}
              />
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
                className={inputClass}
              />
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="Pincode"
                className={inputClass}
              />
            </div>
          </motion.div>

          {/* Order Summary – 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <h2 className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7] mb-6">
              Order Summary
            </h2>

            <div className="border border-[#C5A059]/20 p-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product._id}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 overflow-hidden shrink-0">
                      <img
                        src={item.product.images?.[0] || '/placeholder.jpg'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-['Montserrat'] text-[#FDFBF7] text-xs">
                        {item.product.name}
                      </p>
                      <p className="font-['Montserrat'] text-[#FDFBF7]/40 text-[10px]">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-['Montserrat'] text-[#FDFBF7]/70 text-xs">
                    ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}

              <div className="h-[1px] bg-[#C5A059]/20 my-4" />

              <div className="flex justify-between items-center">
                <span className="font-['Montserrat'] text-[#FDFBF7]/60 text-xs tracking-[0.2em] uppercase">
                  Total
                </span>
                <span className="font-['Cormorant_Garamond'] text-2xl text-[#C5A059]">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full mt-8 py-4 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-gradient-to-r hover:from-[#C5A059] hover:to-[#E8D0A9] hover:text-[#4A3528] transition-all duration-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Pay Now'}
            </button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-8 text-[#C5A059]/40">
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span className="font-['Montserrat'] text-[10px] tracking-widest uppercase">
                  Secure
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={14} />
                <span className="font-['Montserrat'] text-[10px] tracking-widest uppercase">
                  Encrypted
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={14} />
                <span className="font-['Montserrat'] text-[10px] tracking-widest uppercase">
                  Razorpay
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
