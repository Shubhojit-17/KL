import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Shield, Lock, CreditCard, Tag, Check, MapPin, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { paymentService } from '@/services/payment.service';
import { userService, type Address } from '@/services/user.service';
import { couponService, type CouponValidationResult } from '@/services/coupon.service';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { getImageUrl } from '@/lib/image';

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

  // Form & Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [form, setForm] = useState<ShippingForm>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Coupons
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const list = await userService.getAddresses();
        setSavedAddresses(list);
        if (list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(def._id || '');
          setForm({
            fullName: def.fullName,
            phone: def.phone,
            addressLine1: def.addressLine1,
            addressLine2: def.addressLine2 || '',
            city: def.city,
            state: def.state,
            pincode: def.pincode,
          });
        }
      } catch {
        // user may not have addresses or profile
      }
    };
    fetchAddresses();
  }, []);

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddressId(addr._id || '');
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAddressId(''); // custom edit
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setValidatingCoupon(true);
    try {
      const res = await couponService.validateCoupon(couponCodeInput.trim(), totalPrice);
      setAppliedCoupon(res);
      toast.success(`Coupon "${res.code}" applied! You saved ₹${res.discountAmount}`);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Invalid coupon code';
      toast.error(msg);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
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

  const finalPayable = appliedCoupon ? appliedCoupon.finalAmount : totalPrice;

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

      // Optionally save to profile if user selected saveToProfile
      if (saveToProfile && !selectedAddressId) {
        userService.addAddress({
          fullName: form.fullName,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: 'India',
        }).catch(() => {});
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
        checkoutAttemptKey.current,
        appliedCoupon?.code
      );

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        order_id: orderData.razorpayOrderId,
        name: 'KL Vase Atelier',
        description: 'Payment for bespoke artisan vases',
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
      // Robust error handling matching backend shape
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to create order';
      toast.error(msg);
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
            <div>
              <h2 className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7] mb-4">
                Shipping Address
              </h2>

              {/* Saved Addresses Selector */}
              {savedAddresses.length > 0 && (
                <div className="mb-6 p-4 border border-[#C5A059]/20 bg-[#4A3528]/40">
                  <p className="font-['Montserrat'] text-[11px] text-[#C5A059] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <MapPin size={13} /> Select from Saved Addresses:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr._id}
                        type="button"
                        onClick={() => handleSelectAddress(addr)}
                        className={`px-3 py-1.5 font-['Montserrat'] text-xs border transition-all text-left ${
                          selectedAddressId === addr._id
                            ? 'border-[#C5A059] bg-[#C5A059]/20 text-[#FDFBF7]'
                            : 'border-[#C5A059]/30 text-[#FDFBF7]/60 hover:border-[#C5A059]/60'
                        }`}
                      >
                        <span className="font-semibold text-white">{addr.fullName}</span> ({addr.city})
                        {addr.isDefault && ' ★'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
              placeholder="Phone Number (10 digits)"
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

            {!selectedAddressId && (
              <label className="flex items-center gap-3 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToProfile}
                  onChange={(e) => setSaveToProfile(e.target.checked)}
                  className="accent-[#C5A059]"
                />
                <span className="font-['Montserrat'] text-xs text-[#FDFBF7]/70 uppercase tracking-wider">
                  Save this address to my profile for future orders
                </span>
              </label>
            )}
          </motion.div>

          {/* Order Summary & Payment – 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >
            <h2 className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7]">
              Order Summary
            </h2>

            <div className="border border-[#C5A059]/20 p-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product._id}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 overflow-hidden shrink-0 border border-[#C5A059]/20">
                      <img
                        src={getImageUrl(item.product.images?.[0])}
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

              {/* Coupon Code Section */}
              <div className="pt-4 border-t border-[#C5A059]/20">
                {appliedCoupon ? (
                  <div className="flex justify-between items-center p-3 bg-[#C5A059]/10 border border-[#C5A059]/30">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-[#C5A059]" />
                      <div>
                        <span className="font-['Montserrat'] font-bold text-xs text-[#C5A059]">
                          {appliedCoupon.code}
                        </span>
                        <p className="font-['Montserrat'] text-[10px] text-green-400">
                          -₹{appliedCoupon.discountAmount.toLocaleString('en-IN')} off
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-[#FDFBF7]/50 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder="Promo / Coupon code"
                      className="bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-xs py-2 px-1 focus:outline-none focus:border-[#C5A059] flex-1 uppercase placeholder:normal-case placeholder:text-[#FDFBF7]/30"
                    />
                    <button
                      type="submit"
                      disabled={validatingCoupon || !couponCodeInput.trim()}
                      className="px-4 py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-[10px] uppercase tracking-wider hover:bg-[#C5A059] hover:text-[#4A3528] transition-all disabled:opacity-40"
                    >
                      {validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
              </div>

              <div className="h-[1px] bg-[#C5A059]/20 my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-['Montserrat'] text-[#FDFBF7]/70">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs font-['Montserrat'] text-green-400">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="font-['Montserrat'] text-[#FDFBF7]/60 text-xs tracking-[0.2em] uppercase font-semibold">
                    Total
                  </span>
                  <span className="font-['Cormorant_Garamond'] text-2xl text-[#C5A059] font-bold">
                    ₹{finalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full py-4 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-gradient-to-r hover:from-[#C5A059] hover:to-[#E8D0A9] hover:text-[#4A3528] transition-all duration-400 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
            >
              {processing ? 'Processing Payment...' : `Pay ₹${finalPayable.toLocaleString('en-IN')}`}
            </button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 text-[#C5A059]/40 pt-2">
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
