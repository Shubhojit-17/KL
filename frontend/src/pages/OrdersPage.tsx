import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Package } from 'lucide-react';
import { paymentService, type Order } from '@/services/payment.service';
import { LoadingScreen } from '@/components/LoadingScreen';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await paymentService.getMyOrders({ limit: 50 });
        setOrders(data.orders ?? []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <LoadingScreen />;

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
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
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
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="border border-[#C5A059]/15 p-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
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
                      className={`font-['Montserrat'] text-[10px] tracking-widest uppercase ${
                        statusColors[order.orderStatus] || 'text-[#FDFBF7]/50'
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                    <span className="font-['Cormorant_Garamond'] text-xl text-[#C5A059]">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="w-12 h-16 shrink-0 overflow-hidden">
                      <img
                        src={item.product?.images?.[0] || '/placeholder.jpg'}
                        alt={item.product?.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
