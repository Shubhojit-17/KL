import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Package, ChevronRight, XCircle, ChevronLeft } from 'lucide-react';
import { paymentService, type Order } from '@/services/payment.service';
import { LoadingScreen } from '@/components/LoadingScreen';
import { getImageUrl } from '@/lib/image';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  created: 'text-[#FDFBF7]/50',
  confirmed: 'text-[#C5A059]',
  shipped: 'text-blue-400',
  delivered: 'text-green-400',
  cancelled: 'text-red-400',
  pending: 'text-[#FDFBF7]/50',
  paid: 'text-green-400',
  failed: 'text-red-400',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await paymentService.getMyOrders({ page: p, limit: 10 });
      setOrders(data.orders ?? []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [fetchOrders, page]);

  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setCancellingId(orderId);
    try {
      await paymentService.cancelOrder(orderId);
      toast.success('Order cancelled successfully.');
      fetchOrders(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading && orders.length === 0) return <LoadingScreen />;

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-4">
            Your Purchases
          </p>
          <h1 className="font-['Cormorant_Garamond'] font-bold text-5xl md:text-6xl text-[#FDFBF7]">
            My Orders
          </h1>
          {total > 0 && (
            <p className="font-['Montserrat'] text-xs text-[#FDFBF7]/40 mt-3 tracking-widest">
              {total} order{total > 1 ? 's' : ''} placed
            </p>
          )}
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-[#C5A059]/20"
          >
            <Package size={48} className="text-[#C5A059]/30 mx-auto mb-6" strokeWidth={1} />
            <p className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7]/60 mb-8">
              No orders yet
            </p>
            <Link
              to="/collection"
              className="inline-block px-10 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-xs hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
            >
              Explore Collection
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const canCancel = ['created', 'confirmed'].includes(order.orderStatus);
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-[#C5A059]/15 hover:border-[#C5A059]/40 transition-colors p-6 bg-[#4A3528]/50"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-[#C5A059]/10">
                    <div>
                      <p className="font-['Montserrat'] text-[#FDFBF7]/40 text-[10px] tracking-widest uppercase">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="font-['Montserrat'] text-[#FDFBF7]/40 text-[10px] mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span
                        className={`font-['Montserrat'] text-[10px] tracking-widest uppercase font-semibold px-2 py-0.5 border ${
                          order.orderStatus === 'cancelled'
                            ? 'border-red-500/30 bg-red-500/10'
                            : 'border-[#C5A059]/30 bg-[#C5A059]/10'
                        } ${statusColors[order.orderStatus] || 'text-[#FDFBF7]/50'}`}
                      >
                        {order.orderStatus}
                      </span>
                      <span className="font-['Cormorant_Garamond'] text-xl text-[#C5A059] font-bold">
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-3 overflow-x-auto pb-2 flex-1">
                      {order.items?.map((item, i) => (
                        <div
                          key={i}
                          className="w-14 h-16 shrink-0 overflow-hidden border border-[#C5A059]/15 relative group"
                          title={item.product?.name || item.name}
                        >
                          <img
                            src={getImageUrl(item.product?.images?.[0])}
                            alt={item.product?.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 bg-[#4A3528]/90 text-[#FDFBF7] text-[9px] px-1 font-['Montserrat']">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {canCancel && (
                        <button
                          onClick={(e) => handleCancelOrder(order._id, e)}
                          disabled={cancellingId === order._id}
                          className="text-xs text-red-400 hover:text-red-300 font-['Montserrat'] uppercase tracking-wider py-2 px-3 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          {cancellingId === order._id ? '...' : 'Cancel'}
                        </button>
                      )}
                      <Link
                        to={`/orders/${order._id}`}
                        className="flex items-center gap-1 text-[#C5A059] hover:text-[#E8D0A9] font-['Montserrat'] text-xs uppercase tracking-wider py-2 px-3 border border-[#C5A059]/40 hover:border-[#C5A059] transition-all"
                      >
                        Details <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 border border-[#C5A059]/30 text-[#FDFBF7]/60 hover:text-[#C5A059] hover:border-[#C5A059] disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-['Montserrat'] text-xs text-[#FDFBF7]/70 tracking-widest">
                  PAGE {page} OF {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 border border-[#C5A059]/30 text-[#FDFBF7]/60 hover:text-[#C5A059] hover:border-[#C5A059] disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
