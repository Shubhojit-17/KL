import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Printer, XCircle, CheckCircle2, Truck, Package, Clock, ShieldCheck } from 'lucide-react';
import { paymentService, type Order } from '@/services/payment.service';
import { LoadingScreen } from '@/components/LoadingScreen';
import { getImageUrl } from '@/lib/image';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const data = await paymentService.getMyOrder(id);
        setOrder(data);
      } catch (err: any) {
        toast.error('Failed to load order details');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, navigate]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order? If you have already paid, our team will initiate a refund.')) {
      return;
    }

    setCancelling(true);
    try {
      const updated = await paymentService.cancelOrder(order._id);
      setOrder(updated);
      toast.success('Order cancelled successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingScreen />;
  if (!order) return null;

  const isCancelled = order.orderStatus === 'cancelled';
  const canCancel = ['created', 'confirmed'].includes(order.orderStatus);

  const steps = [
    { key: 'created', label: 'Order Placed', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Package },
  ];

  const currentStepIdx = (() => {
    if (order.orderStatus === 'delivered') return 3;
    if (order.orderStatus === 'shipped') return 2;
    if (order.orderStatus === 'confirmed') return 1;
    return 0;
  })();

  const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen print:bg-white print:text-black print:py-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <Link
            to="/orders"
            className="flex items-center gap-2 text-[#C5A059] font-['Montserrat'] text-xs uppercase tracking-widest hover:text-[#E8D0A9] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Orders
          </Link>
          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-[#C5A059]/40 text-[#FDFBF7] font-['Montserrat'] text-xs tracking-wider uppercase hover:border-[#C5A059] hover:text-[#C5A059] transition-all"
            >
              <Printer size={14} /> Print Invoice
            </button>
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 font-['Montserrat'] text-xs tracking-wider uppercase hover:bg-red-500/10 transition-all disabled:opacity-40"
              >
                <XCircle size={14} /> {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {/* Invoice Header (Brand styling for screen and print) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#C5A059]/20 p-8 md:p-10 bg-[#4A3528]/80 backdrop-blur-sm print:border-black/20 print:bg-white print:p-2"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-[#C5A059]/15 print:border-black/20">
            <div>
              <p className="font-['Montserrat'] text-[#C5A059] print:text-[#4A3528] text-xs uppercase tracking-[0.25em] font-semibold">
                KL Vase Atelier · Tax Invoice
              </p>
              <h1 className="font-['Cormorant_Garamond'] text-3xl md:text-4xl text-[#FDFBF7] print:text-black font-bold mt-2">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="font-['Montserrat'] text-[#FDFBF7]/50 print:text-gray-600 text-xs mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 font-['Montserrat'] text-[11px] tracking-widest uppercase rounded-sm ${
                  isCancelled
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : order.orderStatus === 'delivered'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                    : 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40'
                }`}
              >
                {order.orderStatus}
              </span>
              <p className="font-['Montserrat'] text-xs text-[#FDFBF7]/50 print:text-gray-600 mt-2">
                Payment: <strong className="capitalize text-[#FDFBF7] print:text-black">{order.paymentStatus}</strong>
              </p>
            </div>
          </div>

          {/* Timeline Tracker (hidden on print or when cancelled) */}
          {!isCancelled && (
            <div className="my-10 print:hidden">
              <div className="grid grid-cols-4 relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-8 right-8 h-[2px] bg-[#C5A059]/20 -z-0">
                  <div
                    className="h-full bg-[#C5A059] transition-all duration-700"
                    style={{ width: `${(currentStepIdx / 3) * 100}%` }}
                  />
                </div>

                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx <= currentStepIdx;
                  return (
                    <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-[#C5A059] text-[#4A3528] shadow-[0_0_15px_rgba(197,160,89,0.4)]'
                            : 'bg-[#4A3528] border border-[#C5A059]/30 text-[#FDFBF7]/40'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <p
                        className={`font-['Montserrat'] text-[11px] uppercase tracking-wider mt-3 ${
                          isActive ? 'text-[#C5A059] font-medium' : 'text-[#FDFBF7]/40'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="my-8 p-4 bg-red-500/10 border border-red-500/30 text-center">
              <p className="font-['Montserrat'] text-xs text-red-300 tracking-wide">
                This order has been cancelled. If any payment was captured, refund details will be sent via email.
              </p>
            </div>
          )}

          {/* Items Table */}
          <div className="my-8">
            <h3 className="font-['Cormorant_Garamond'] text-xl text-[#FDFBF7] print:text-black mb-4">
              Purchased Pieces
            </h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#C5A059]/20 print:border-black/20 text-[#C5A059] print:text-black font-['Montserrat'] text-[10px] tracking-widest uppercase">
                  <th className="py-3">Piece</th>
                  <th className="py-3 text-center">Qty</th>
                  <th className="py-3 text-right">Unit Price</th>
                  <th className="py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FDFBF7]/5 print:divide-black/10">
                {order.items.map((item, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-14 overflow-hidden border border-[#C5A059]/20 shrink-0 print:border-none">
                          <img
                            src={getImageUrl(item.product?.images?.[0])}
                            alt={item.product?.name || item.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-['Cormorant_Garamond'] text-lg font-bold text-[#FDFBF7] print:text-black">
                            {item.product?.name || item.name}
                          </p>
                          {item.product?.category && (
                            <p className="font-['Montserrat'] text-[10px] text-[#FDFBF7]/40 print:text-gray-500 uppercase tracking-widest">
                              {item.product.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center font-['Montserrat'] text-[#FDFBF7]/80 print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-4 text-right font-['Montserrat'] text-[#FDFBF7]/80 print:text-black">
                      ₹{item.price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 text-right font-['Montserrat'] text-[#C5A059] print:text-black font-semibold">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Addresses Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#C5A059]/15 print:border-black/20">
            <div>
              <h4 className="font-['Montserrat'] text-xs text-[#C5A059] print:text-black uppercase tracking-widest font-semibold mb-3">
                Shipping Details
              </h4>
              <div className="font-['Montserrat'] text-xs text-[#FDFBF7]/70 print:text-gray-700 leading-relaxed space-y-1">
                <p className="font-bold text-[#FDFBF7] print:text-black">{order.shippingAddress?.fullName}</p>
                <p>{order.shippingAddress?.phone}</p>
                <p>{order.shippingAddress?.addressLine1}</p>
                {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                </p>
                <p>{order.shippingAddress?.country || 'India'}</p>
              </div>
            </div>

            <div className="space-y-3 font-['Montserrat'] text-xs">
              <div className="flex justify-between text-[#FDFBF7]/70 print:text-gray-700">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.coupon?.discountAmount ? (
                <div className="flex justify-between text-green-400 print:text-green-700">
                  <span>Coupon Discount ({order.coupon.code})</span>
                  <span>-₹{order.coupon.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-[#FDFBF7]/70 print:text-gray-700">
                <span>Shipping</span>
                <span>Complimentary</span>
              </div>
              <div className="h-[1px] bg-[#C5A059]/20 print:bg-black/20 my-2" />
              <div className="flex justify-between text-[#FDFBF7] print:text-black text-base font-bold">
                <span>Grand Total</span>
                <span className="font-['Cormorant_Garamond'] text-2xl text-[#C5A059] print:text-black">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <p className="text-[10px] text-[#FDFBF7]/40 print:text-gray-500 text-right pt-1">
                  Ref: {order.razorpay_payment_id}
                </p>
              )}
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#C5A059]/10 print:border-black/10 flex items-center justify-between text-[11px] text-[#FDFBF7]/40 print:text-gray-500 font-['Montserrat']">
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#C5A059]" /> Verified Authenticity Guarantee
            </span>
            <span>support@klvase.com</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
