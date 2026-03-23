import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';
import { productService, type Product } from '@/services/product.service';
import { adminService } from '@/services/admin.service';
import type { Order } from '@/services/payment.service';
import { LoadingScreen } from '@/components/LoadingScreen';
import toast from 'react-hot-toast';

type Tab = 'products' | 'orders' | 'users';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('products');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'products', label: 'Products', icon: <Package size={16} /> },
    { key: 'orders', label: 'Orders', icon: <ShoppingCart size={16} /> },
    { key: 'users', label: 'Users', icon: <Users size={16} /> },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-2">
            Administration
          </p>
          <h1 className="font-['Cormorant_Garamond'] font-bold text-4xl md:text-5xl text-[#FDFBF7]">
            Dashboard
          </h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 border-b border-[#C5A059]/15">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-3 font-['Montserrat'] text-xs tracking-widest uppercase transition-all border-b-2 ${
                tab === t.key
                  ? 'border-[#C5A059] text-[#C5A059]'
                  : 'border-transparent text-[#FDFBF7]/40 hover:text-[#FDFBF7]/70'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'products' && <ProductsTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'users' && <UsersTab />}
      </div>
    </section>
  );
}

/* ─── Products Tab ─── */
function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productService.getAllProductsAdmin();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="font-['Montserrat'] text-[#FDFBF7]/50 text-xs tracking-widest">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-[10px] tracking-widest uppercase hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingProduct(null);
            fetchProducts();
          }}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#C5A059]/20">
              {['Image', 'Name', 'Price', 'Stock', 'Active', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left font-['Montserrat'] text-[#C5A059] text-[10px] tracking-widest uppercase py-3 px-3"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p._id}
                className="border-b border-[#FDFBF7]/5 hover:bg-[#FDFBF7]/[0.02] transition-colors"
              >
                <td className="py-3 px-3">
                  <div className="w-10 h-12 overflow-hidden">
                    <img
                      src={p.images?.[0] || '/placeholder.jpg'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </td>
                <td className="py-3 px-3 font-['Montserrat'] text-[#FDFBF7] text-sm">
                  {p.name}
                </td>
                <td className="py-3 px-3 font-['Montserrat'] text-[#FDFBF7]/70 text-sm">
                  ₹{p.price?.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 font-['Montserrat'] text-sm">
                  <span className={p.stock <= 5 ? 'text-red-400' : 'text-[#FDFBF7]/70'}>
                    {p.stock}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      p.isActive ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                </td>
                <td className="py-3 px-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setShowForm(true);
                      }}
                      className="text-[#C5A059] hover:text-[#E8D0A9] transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="text-[#FDFBF7]/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Product Form ─── */
function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    stock: product?.stock?.toString() || '',
    category: product?.category || '',
    images: product?.images?.join(', ') || '',
    isActive: product?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category || undefined,
        images: form.images
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        isActive: form.isActive,
      };

      if (product) {
        await productService.updateProduct(product._id, payload);
        toast.success('Product updated');
      } else {
        await productService.createProduct(payload);
        toast.success('Product created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-["Montserrat"] text-sm py-3 px-1 focus:outline-none focus:border-[#C5A059] transition-colors placeholder:text-[#FDFBF7]/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 border border-[#C5A059]/20 p-6 relative"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-[#FDFBF7]/40 hover:text-[#FDFBF7]"
      >
        <X size={18} />
      </button>
      <h3 className="font-['Cormorant_Garamond'] text-xl text-[#FDFBF7] mb-6">
        {product ? 'Edit Product' : 'New Product'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product Name"
          required
          className={inputClass}
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          rows={3}
          className={`${inputClass} resize-none`}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            placeholder="Price (₹)"
            required
            className={inputClass}
          />
          <input
            name="stock"
            type="number"
            value={form.stock}
            onChange={handleChange}
            placeholder="Stock"
            required
            className={inputClass}
          />
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Category"
            className={inputClass}
          />
        </div>
        <input
          name="images"
          value={form.images}
          onChange={handleChange}
          placeholder="Image URLs (comma-separated)"
          className={inputClass}
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="accent-[#C5A059]"
          />
          <span className="font-['Montserrat'] text-[#FDFBF7]/70 text-xs tracking-widest uppercase">
            Active
          </span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-[10px] hover:bg-[#C5A059] hover:text-[#4A3528] transition-all disabled:opacity-40"
        >
          {saving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </form>
    </motion.div>
  );
}

/* ─── Orders Tab ─── */
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await adminService.getAllOrders({ limit: 100 });
      setOrders(data.orders ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminService.updateOrderStatus(id, status);
      toast.success('Status updated');
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <LoadingScreen />;

  const getStatusOptions = (currentStatus: string) => {
    const map: Record<string, string[]> = {
      created: ['created', 'cancelled'],
      confirmed: ['confirmed', 'shipped', 'cancelled'],
      shipped: ['shipped', 'delivered'],
      delivered: ['delivered'],
      cancelled: ['cancelled'],
    };
    return map[currentStatus] || [currentStatus];
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#C5A059]/20">
            {['Order ID', 'Customer', 'Amount', 'Payment', 'Status', 'Date'].map(
              (h) => (
                <th
                  key={h}
                  className="text-left font-['Montserrat'] text-[#C5A059] text-[10px] tracking-widest uppercase py-3 px-3"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order._id}
              className="border-b border-[#FDFBF7]/5 hover:bg-[#FDFBF7]/[0.02] transition-colors"
            >
              <td className="py-3 px-3 font-['Montserrat'] text-[#FDFBF7]/60 text-xs">
                #{order._id.slice(-8).toUpperCase()}
              </td>
              <td className="py-3 px-3 font-['Montserrat'] text-[#FDFBF7] text-xs">
                {order.shippingAddress?.fullName || 'N/A'}
              </td>
              <td className="py-3 px-3 font-['Montserrat'] text-[#C5A059] text-sm">
                ₹{order.totalAmount?.toLocaleString('en-IN')}
              </td>
              <td className="py-3 px-3 font-['Montserrat'] text-xs capitalize">
                <span
                  className={
                    order.paymentStatus === 'paid'
                      ? 'text-green-400'
                      : order.paymentStatus === 'failed'
                      ? 'text-red-400'
                      : 'text-[#FDFBF7]/50'
                  }
                >
                  {order.paymentStatus}
                </span>
              </td>
              <td className="py-3 px-3">
                <select
                  value={order.orderStatus}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  className="bg-[#4A3528] border border-[#C5A059]/20 text-[#FDFBF7] font-['Montserrat'] text-[10px] tracking-widest uppercase px-2 py-1 focus:outline-none focus:border-[#C5A059]"
                >
                  {getStatusOptions(order.orderStatus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-3 font-['Montserrat'] text-[#FDFBF7]/40 text-[10px]">
                {new Date(order.createdAt).toLocaleDateString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <p className="text-center py-12 font-['Montserrat'] text-[#FDFBF7]/40 text-sm">
          No orders yet
        </p>
      )}
    </div>
  );
}

/* ─── Users Tab ─── */
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await adminService.getAllUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#C5A059]/20">
            {['Name', 'Email', 'Role', 'Joined'].map((h) => (
              <th
                key={h}
                className="text-left font-['Montserrat'] text-[#C5A059] text-[10px] tracking-widest uppercase py-3 px-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u._id}
              className="border-b border-[#FDFBF7]/5 hover:bg-[#FDFBF7]/[0.02] transition-colors"
            >
              <td className="py-3 px-3 font-['Montserrat'] text-[#FDFBF7] text-sm">
                {u.name}
              </td>
              <td className="py-3 px-3 font-['Montserrat'] text-[#FDFBF7]/70 text-xs">
                {u.email}
              </td>
              <td className="py-3 px-3">
                <span
                  className={`font-['Montserrat'] text-[10px] tracking-widest uppercase ${
                    u.role === 'admin' ? 'text-[#C5A059]' : 'text-[#FDFBF7]/50'
                  }`}
                >
                  {u.role}
                </span>
              </td>
              <td className="py-3 px-3 font-['Montserrat'] text-[#FDFBF7]/40 text-[10px]">
                {new Date(u.createdAt).toLocaleDateString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <p className="text-center py-12 font-['Montserrat'] text-[#FDFBF7]/40 text-sm">
          No users found
        </p>
      )}
    </div>
  );
}
