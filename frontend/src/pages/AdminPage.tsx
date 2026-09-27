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
  Tag,
  Upload,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { productService, type Product } from '@/services/product.service';
import { adminService, type AdminMetrics } from '@/services/admin.service';
import { couponService, type Coupon } from '@/services/coupon.service';
import type { Order } from '@/services/payment.service';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { getImageUrl } from '@/lib/image';
import toast from 'react-hot-toast';

type Tab = 'products' | 'orders' | 'users' | 'coupons';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('products');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await adminService.getMetrics();
      setMetrics(data);
    } catch {
      // silently fail if metrics endpoint unavailable
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'products', label: 'Products', icon: <Package size={16} /> },
    { key: 'orders', label: 'Orders', icon: <ShoppingCart size={16} /> },
    { key: 'users', label: 'Users', icon: <Users size={16} /> },
    { key: 'coupons', label: 'Coupons', icon: <Tag size={16} /> },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="font-['Montserrat'] text-[#C5A059] text-xs tracking-[0.3em] uppercase mb-2">
            Administration
          </p>
          <h1 className="font-['Cormorant_Garamond'] font-bold text-4xl md:text-5xl text-[#FDFBF7]">
            Atelier Dashboard
          </h1>
        </motion.div>

        {/* Metrics Overview Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="border border-[#C5A059]/20 p-5 bg-[#4A3528]/40">
              <p className="font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <TrendingUp size={12} /> Total Revenue
              </p>
              <h3 className="font-['Cormorant_Garamond'] text-2xl md:text-3xl font-bold text-[#FDFBF7]">
                ₹{metrics.totalRevenue?.toLocaleString('en-IN')}
              </h3>
            </div>

            <div className="border border-[#C5A059]/20 p-5 bg-[#4A3528]/40">
              <p className="font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <ShoppingCart size={12} /> Total Orders
              </p>
              <h3 className="font-['Cormorant_Garamond'] text-2xl md:text-3xl font-bold text-[#FDFBF7]">
                {metrics.totalOrders}
              </h3>
              <p className="font-['Montserrat'] text-[10px] text-[#FDFBF7]/40 mt-1">
                {metrics.pendingOrders} pending · {metrics.deliveredOrders} delivered
              </p>
            </div>

            <div className="border border-[#C5A059]/20 p-5 bg-[#4A3528]/40">
              <p className="font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Package size={12} /> Active Pieces
              </p>
              <h3 className="font-['Cormorant_Garamond'] text-2xl md:text-3xl font-bold text-[#FDFBF7]">
                {metrics.totalProducts}
              </h3>
              {metrics.lowStockProducts > 0 && (
                <p className="font-['Montserrat'] text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} /> {metrics.lowStockProducts} low stock
                </p>
              )}
            </div>

            <div className="border border-[#C5A059]/20 p-5 bg-[#4A3528]/40">
              <p className="font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Users size={12} /> Registered Clients
              </p>
              <h3 className="font-['Cormorant_Garamond'] text-2xl md:text-3xl font-bold text-[#FDFBF7]">
                {metrics.totalUsers}
              </h3>
            </div>
          </div>
        )}

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

        {tab === 'products' && <ProductsTab onProductChanged={fetchMetrics} />}
        {tab === 'orders' && <OrdersTab onOrderChanged={fetchMetrics} />}
        {tab === 'users' && <UsersTab />}
        {tab === 'coupons' && <CouponsTab />}
      </div>
    </section>
  );
}

/* ─── Products Tab ─── */
function ProductsTab({ onProductChanged }: { onProductChanged: () => void }) {
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
    if (!confirm('Deactivate this piece?')) return;
    try {
      await productService.deleteProduct(id);
      toast.success('Piece deactivated');
      fetchProducts();
      onProductChanged();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="font-['Montserrat'] text-[#FDFBF7]/50 text-xs tracking-widest">
          {products.length} piece{products.length !== 1 ? 's' : ''} in catalog
        </p>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-[10px] tracking-widest uppercase hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
        >
          <Plus size={14} /> Add Piece
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
            onProductChanged();
          }}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-[#C5A059]/15">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#C5A059]/20 bg-[#4A3528]/80">
              {['Image', 'Name', 'Category', 'Price', 'Stock', 'Active', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="text-left font-['Montserrat'] text-[#C5A059] text-[10px] tracking-widest uppercase py-3 px-4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p._id}
                className="border-b border-[#FDFBF7]/5 hover:bg-[#FDFBF7]/[0.02] transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="w-10 h-12 overflow-hidden border border-[#C5A059]/20">
                    <img
                      src={getImageUrl(p.images?.[0])}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7] text-sm">
                  {p.name}
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7]/60 text-xs">
                  {p.category || '—'}
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7]/80 text-sm">
                  ₹{p.price?.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-sm">
                  <span className={p.stock <= 5 ? 'text-red-400 font-semibold' : 'text-[#FDFBF7]/70'}>
                    {p.stock}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      p.isActive ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    title={p.isActive ? 'Active' : 'Inactive'}
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setShowForm(true);
                      }}
                      className="text-[#C5A059] hover:text-[#E8D0A9] transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="text-[#FDFBF7]/30 hover:text-red-400 transition-colors"
                      title="Deactivate"
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
  const [uploading, setUploading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await adminService.uploadProductImage(file);
      setForm((prev) => ({
        ...prev,
        images: prev.images ? `${prev.images}, ${url}` : url,
      }));
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
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
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to save product');
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
      className="mb-8 border border-[#C5A059]/30 p-6 relative bg-[#4A3528]/90 backdrop-blur-sm"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-[#FDFBF7]/40 hover:text-[#FDFBF7]"
      >
        <X size={18} />
      </button>
      <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7] mb-6">
        {product ? 'Edit Piece' : 'New Curated Piece'}
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
          placeholder="Artisanal Description"
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
            placeholder="Stock Quantity"
            required
            className={inputClass}
          />
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Category (e.g. Ceramic)"
            className={inputClass}
          />
        </div>

        {/* Image URLs input + File Upload */}
        <div>
          <input
            name="images"
            value={form.images}
            onChange={handleChange}
            placeholder="Image URLs (comma-separated)"
            className={inputClass}
          />
          <div className="mt-3 flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-[#C5A059]/40 text-[#C5A059] font-['Montserrat'] text-xs tracking-wider uppercase hover:bg-[#C5A059]/10 transition-all">
              <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload Image File'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <span className="font-['Montserrat'] text-[11px] text-[#FDFBF7]/40">
              Uploads JPG, PNG, WEBP directly to server
            </span>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="accent-[#C5A059]"
          />
          <span className="font-['Montserrat'] text-[#FDFBF7]/70 text-xs tracking-widest uppercase">
            Active in Collection
          </span>
        </label>
        <button
          type="submit"
          disabled={saving || uploading}
          className="px-8 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] tracking-[0.2em] uppercase text-[10px] hover:bg-[#C5A059] hover:text-[#4A3528] transition-all disabled:opacity-40 font-semibold"
        >
          {saving ? 'Saving...' : product ? 'Update Piece' : 'Publish Piece'}
        </button>
      </form>
    </motion.div>
  );
}

/* ─── Orders Tab ─── */
function OrdersTab({ onOrderChanged }: { onOrderChanged: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async (p: number) => {
    try {
      const data = await adminService.getAllOrders({ page: p, limit: 15 });
      setOrders(data.orders ?? []);
      setTotalPages(data.pages || 1);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [fetchOrders, page]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminService.updateOrderStatus(id, status);
      toast.success('Status updated');
      fetchOrders(page);
      onOrderChanged();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update status');
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
    <div className="space-y-4">
      <div className="overflow-x-auto border border-[#C5A059]/15">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#C5A059]/20 bg-[#4A3528]/80">
              {['Order ID', 'Customer', 'Amount', 'Payment', 'Status', 'Date'].map((h) => (
                <th
                  key={h}
                  className="text-left font-['Montserrat'] text-[#C5A059] text-[10px] tracking-widest uppercase py-3 px-4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order._id}
                className="border-b border-[#FDFBF7]/5 hover:bg-[#FDFBF7]/[0.02] transition-colors"
              >
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7]/60 text-xs">
                  #{order._id.slice(-8).toUpperCase()}
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7] text-xs">
                  {order.shippingAddress?.fullName || 'N/A'}
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#C5A059] text-sm">
                  ₹{order.totalAmount?.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-xs capitalize">
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
                <td className="py-3 px-4">
                  <select
                    value={order.orderStatus}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className="bg-[#4A3528] border border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-[10px] tracking-widest uppercase px-2 py-1 focus:outline-none focus:border-[#C5A059]"
                  >
                    {getStatusOptions(order.orderStatus).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7]/40 text-[10px]">
                  {new Date(order.createdAt).toLocaleDateString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="text-center py-12 font-['Montserrat'] text-[#FDFBF7]/40 text-sm">
            No orders found
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 border border-[#C5A059]/30 text-[#FDFBF7]/60 hover:text-[#C5A059] disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-['Montserrat'] text-xs text-[#FDFBF7]/70 tracking-widest">
            PAGE {page} OF {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 border border-[#C5A059]/30 text-[#FDFBF7]/60 hover:text-[#C5A059] disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Users Tab (With Promote/Revoke Admin buttons) ─── */
function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAssignAdmin = async (email: string) => {
    if (!confirm(`Grant Admin role to ${email}?`)) return;
    try {
      await adminService.assignAdmin(email);
      toast.success(`Admin role granted to ${email}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to grant admin');
    }
  };

  const handleRevokeAdmin = async (email: string) => {
    if (!confirm(`Revoke Admin role from ${email}?`)) return;
    try {
      await adminService.revokeAdmin(email);
      toast.success(`Admin role revoked from ${email}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to revoke admin');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="overflow-x-auto border border-[#C5A059]/15">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#C5A059]/20 bg-[#4A3528]/80">
            {['Name', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
              <th
                key={h}
                className="text-left font-['Montserrat'] text-[#C5A059] text-[10px] tracking-widest uppercase py-3 px-4"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = currentUser?.email?.toLowerCase() === u.email?.toLowerCase();
            return (
              <tr
                key={u._id}
                className="border-b border-[#FDFBF7]/5 hover:bg-[#FDFBF7]/[0.02] transition-colors"
              >
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7] text-sm">
                  {u.name} {isSelf && '(You)'}
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7]/70 text-xs">
                  {u.email}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`font-['Montserrat'] text-[10px] tracking-widest uppercase px-2 py-0.5 border ${
                      u.role === 'admin'
                        ? 'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10'
                        : 'border-[#FDFBF7]/20 text-[#FDFBF7]/50'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7]/40 text-[10px]">
                  {new Date(u.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="py-3 px-4">
                  {!isSelf && (
                    u.role === 'admin' ? (
                      <button
                        onClick={() => handleRevokeAdmin(u.email)}
                        className="text-[10px] font-['Montserrat'] text-red-400 hover:text-red-300 uppercase tracking-wider flex items-center gap-1 border border-red-500/30 px-2 py-1"
                      >
                        <ShieldAlert size={12} /> Revoke Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAssignAdmin(u.email)}
                        className="text-[10px] font-['Montserrat'] text-[#C5A059] hover:text-[#E8D0A9] uppercase tracking-wider flex items-center gap-1 border border-[#C5A059]/40 px-2 py-1"
                      >
                        <Shield size={12} /> Make Admin
                      </button>
                    )
                  )}
                </td>
              </tr>
            );
          })}
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

/* ─── Coupons Tab ─── */
function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: '',
    usageLimit: '',
  });

  const fetchCoupons = useCallback(async () => {
    try {
      const data = await couponService.getAllCoupons();
      setCoupons(data);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) return;

    try {
      await couponService.createCoupon({
        code: newCoupon.code.trim(),
        discountType: newCoupon.discountType,
        discountValue: Number(newCoupon.discountValue),
        minOrderAmount: Number(newCoupon.minOrderAmount) || 0,
        maxDiscount: newCoupon.maxDiscount ? Number(newCoupon.maxDiscount) : undefined,
        usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : undefined,
      });
      toast.success('Coupon created');
      setShowAddModal(false);
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscount: '',
        usageLimit: '',
      });
      fetchCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await couponService.toggleCoupon(id);
      fetchCoupons();
    } catch {
      toast.error('Failed to toggle coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await couponService.deleteCoupon(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="font-['Montserrat'] text-[#FDFBF7]/50 text-xs tracking-widest">
          {coupons.length} promotional code{coupons.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-[10px] tracking-widest uppercase hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
        >
          <Plus size={14} /> New Coupon
        </button>
      </div>

      {showAddModal && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 border border-[#C5A059]/30 p-6 bg-[#4A3528]/80 relative"
        >
          <button
            onClick={() => setShowAddModal(false)}
            className="absolute top-4 right-4 text-[#FDFBF7]/40 hover:text-[#FDFBF7]"
          >
            <X size={18} />
          </button>
          <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7] mb-6">
            Create Promotional Coupon
          </h3>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                placeholder="Code (e.g. ATELIER20) *"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                required
                className="bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059] uppercase"
              />
              <select
                value={newCoupon.discountType}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, discountType: e.target.value as 'percentage' | 'flat' })
                }
                className="bg-[#4A3528] border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
              <input
                type="number"
                placeholder="Discount Value *"
                value={newCoupon.discountValue}
                onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                required
                className="bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Min Order Amount (₹)"
                value={newCoupon.minOrderAmount || ''}
                onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: Number(e.target.value) })}
                className="bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
              />
              <input
                type="number"
                placeholder="Max Discount Cap (₹)"
                value={newCoupon.maxDiscount}
                onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value })}
                className="bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
              />
              <input
                type="number"
                placeholder="Total Usage Limit"
                value={newCoupon.usageLimit}
                onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                className="bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#C5A059] text-[#4A3528] font-['Montserrat'] text-xs uppercase tracking-widest font-semibold"
            >
              Create Coupon
            </button>
          </form>
        </motion.div>
      )}

      <div className="overflow-x-auto border border-[#C5A059]/15">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#C5A059]/20 bg-[#4A3528]/80">
              {['Code', 'Discount', 'Min Order', 'Used', 'Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="text-left font-['Montserrat'] text-[#C5A059] text-[10px] tracking-widest uppercase py-3 px-4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr
                key={c._id}
                className="border-b border-[#FDFBF7]/5 hover:bg-[#FDFBF7]/[0.02] transition-colors"
              >
                <td className="py-3 px-4 font-['Montserrat'] text-[#C5A059] font-bold text-sm">
                  {c.code}
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7] text-xs">
                  {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                  {c.maxDiscount ? ` (up to ₹${c.maxDiscount})` : ''}
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7]/70 text-xs">
                  ₹{c.minOrderAmount || 0}
                </td>
                <td className="py-3 px-4 font-['Montserrat'] text-[#FDFBF7]/70 text-xs">
                  {c.usageCount} {c.usageLimit ? `/ ${c.usageLimit}` : 'uses'}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleToggle(c._id)}
                    className={`font-['Montserrat'] text-[10px] uppercase tracking-wider px-2 py-0.5 border ${
                      c.isActive
                        ? 'border-green-400 text-green-400 bg-green-400/10'
                        : 'border-red-400 text-red-400 bg-red-400/10'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-[#FDFBF7]/30 hover:text-red-400 transition-colors"
                    title="Delete Coupon"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && (
          <p className="text-center py-12 font-['Montserrat'] text-[#FDFBF7]/40 text-sm">
            No coupons created yet
          </p>
        )}
      </div>
    </div>
  );
}
