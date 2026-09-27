import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { User, MapPin, Heart, Plus, Trash2, Check, Star, ShoppingBag, X } from 'lucide-react';
import { userService, type Address, type UserProfile } from '@/services/user.service';
import type { Product } from '@/services/product.service';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { getImageUrl } from '@/lib/image';
import { Link } from 'react-router';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'addresses' | 'wishlist';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { addToCart } = useCart();
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState<Omit<Address, '_id'>>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: false,
  });

  const loadData = useCallback(async () => {
    try {
      const [profData, addrData, wishData] = await Promise.all([
        userService.getProfile(),
        userService.getAddresses(),
        userService.getWishlist(),
      ]);
      setProfile(profData);
      setNameVal(profData?.name || '');
      setAddresses(addrData);
      setWishlist(wishData);
    } catch {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameVal.trim()) return;
    setSavingProfile(true);
    try {
      const updated = await userService.updateProfile(nameVal);
      setProfile(updated);
      setEditingName(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast.error('Please fill all required address fields');
      return;
    }

    try {
      const res = await userService.addAddress(addressForm);
      setAddresses(res.addresses);
      setShowAddressModal(false);
      setAddressForm({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        isDefault: false,
      });
      toast.success('Address saved');
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id?: string) => {
    if (!id || !confirm('Delete this address?')) return;
    try {
      const res = await userService.deleteAddress(id);
      setAddresses(res.addresses);
      toast.success('Address removed');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (id?: string) => {
    if (!id) return;
    try {
      const res = await userService.setDefaultAddress(id);
      setAddresses(res.addresses);
      toast.success('Default address updated');
    } catch {
      toast.error('Failed to update default address');
    }
  };

  const handleRemoveWishlist = async (productId: string) => {
    try {
      await userService.removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Item removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product._id, 1);
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <section className="py-16 md:py-24 bg-[#4A3528] px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center md:text-left"
        >
          <p className="font-['Montserrat'] text-[#C5A059] text-xs uppercase tracking-[0.3em] mb-2">
            My Account
          </p>
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-bold text-[#FDFBF7]">
            Welcome, {profile?.name || authUser?.name}
          </h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-10 border-b border-[#C5A059]/15">
          <button
            onClick={() => setTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 font-['Montserrat'] text-xs tracking-widest uppercase transition-all border-b-2 ${
              tab === 'profile'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-[#FDFBF7]/40 hover:text-[#FDFBF7]/70'
            }`}
          >
            <User size={15} /> Profile Details
          </button>
          <button
            onClick={() => setTab('addresses')}
            className={`flex items-center gap-2 px-6 py-3 font-['Montserrat'] text-xs tracking-widest uppercase transition-all border-b-2 ${
              tab === 'addresses'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-[#FDFBF7]/40 hover:text-[#FDFBF7]/70'
            }`}
          >
            <MapPin size={15} /> Saved Addresses ({addresses.length})
          </button>
          <button
            onClick={() => setTab('wishlist')}
            className={`flex items-center gap-2 px-6 py-3 font-['Montserrat'] text-xs tracking-widest uppercase transition-all border-b-2 ${
              tab === 'wishlist'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-[#FDFBF7]/40 hover:text-[#FDFBF7]/70'
            }`}
          >
            <Heart size={15} /> Wishlist ({wishlist.length})
          </button>
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-[#C5A059]/20 p-8 md:p-10 max-w-2xl bg-[#4A3528]/80"
          >
            <h2 className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7] mb-6">
              Account Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-widest mb-1">
                  Full Name
                </label>
                {editingName ? (
                  <form onSubmit={handleUpdateName} className="flex gap-4 items-center">
                    <input
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      className="bg-transparent border-b border-[#C5A059] text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none flex-1"
                      required
                    />
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-4 py-2 bg-[#C5A059] text-[#4A3528] font-['Montserrat'] text-xs tracking-wider uppercase font-semibold"
                    >
                      {savingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingName(false)}
                      className="text-xs text-[#FDFBF7]/40 hover:text-[#FDFBF7]"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center py-2 border-b border-[#C5A059]/20">
                    <span className="font-['Montserrat'] text-sm text-[#FDFBF7]">{profile?.name}</span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="font-['Montserrat'] text-[11px] text-[#C5A059] hover:underline uppercase tracking-wider"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-widest mb-1">
                  Email Address
                </label>
                <p className="font-['Montserrat'] text-sm text-[#FDFBF7]/70 py-2 border-b border-[#C5A059]/20">
                  {profile?.email}
                </p>
              </div>

              <div>
                <label className="block font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-widest mb-1">
                  Account Type
                </label>
                <div className="py-2 flex items-center gap-3">
                  <span className="font-['Montserrat'] text-xs uppercase px-3 py-1 bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 rounded-sm">
                    {profile?.role}
                  </span>
                  <span className="font-['Montserrat'] text-xs text-[#FDFBF7]/40 capitalize">
                    Provider: {profile?.authProvider || 'Google'}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Link
                  to="/orders"
                  className="inline-block px-6 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-xs uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
                >
                  View Order History
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Addresses Tab */}
        {tab === 'addresses' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
              <p className="font-['Montserrat'] text-xs text-[#FDFBF7]/50 tracking-wider">
                Manage your saved delivery locations for quick checkout.
              </p>
              <button
                onClick={() => setShowAddressModal(true)}
                className="flex items-center gap-2 px-5 py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-xs uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
              >
                <Plus size={14} /> Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="border border-[#C5A059]/20 p-12 text-center">
                <MapPin size={36} className="text-[#C5A059]/30 mx-auto mb-4" />
                <p className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7]/60 mb-4">
                  No saved addresses yet
                </p>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-6 py-2 bg-[#C5A059] text-[#4A3528] font-['Montserrat'] text-xs tracking-widest uppercase font-semibold"
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`border p-6 relative flex flex-col justify-between transition-colors ${
                      addr.isDefault
                        ? 'border-[#C5A059] bg-[#C5A059]/5'
                        : 'border-[#C5A059]/20 hover:border-[#C5A059]/40'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-['Cormorant_Garamond'] text-xl font-bold text-[#FDFBF7]">
                          {addr.fullName}
                        </h3>
                        {addr.isDefault && (
                          <span className="flex items-center gap-1 font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-widest bg-[#C5A059]/20 px-2 py-0.5 border border-[#C5A059]/40">
                            <Star size={10} className="fill-[#C5A059]" /> Default
                          </span>
                        )}
                      </div>
                      <div className="font-['Montserrat'] text-xs text-[#FDFBF7]/70 space-y-1">
                        <p>{addr.phone}</p>
                        <p>{addr.addressLine1}</p>
                        {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                        <p>
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p>{addr.country || 'India'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#C5A059]/15">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr._id)}
                          className="font-['Montserrat'] text-[11px] text-[#C5A059] hover:underline uppercase tracking-wider"
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="text-[#FDFBF7]/40 hover:text-red-400 font-['Montserrat'] text-xs flex items-center gap-1 ml-auto"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Address Modal */}
            {showAddressModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#4A3528] border border-[#C5A059]/40 p-8 max-w-lg w-full relative">
                  <button
                    onClick={() => setShowAddressModal(false)}
                    className="absolute top-4 right-4 text-[#FDFBF7]/40 hover:text-[#FDFBF7]"
                  >
                    <X size={20} />
                  </button>
                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7] mb-6">
                    Add New Address
                  </h3>
                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <input
                      placeholder="Full Name *"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      required
                      className="w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
                    />
                    <input
                      placeholder="Mobile Phone *"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      required
                      className="w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
                    />
                    <input
                      placeholder="Address Line 1 *"
                      value={addressForm.addressLine1}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                      required
                      className="w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
                    />
                    <input
                      placeholder="Address Line 2 (Optional)"
                      value={addressForm.addressLine2}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                      className="w-full bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        placeholder="City *"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        required
                        className="bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
                      />
                      <input
                        placeholder="State *"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        required
                        className="bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
                      />
                      <input
                        placeholder="Pincode *"
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        required
                        className="bg-transparent border-b border-[#C5A059]/30 text-[#FDFBF7] font-['Montserrat'] text-sm py-2 px-1 focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>
                    <label className="flex items-center gap-3 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="accent-[#C5A059]"
                      />
                      <span className="font-['Montserrat'] text-xs text-[#FDFBF7]/70 uppercase tracking-wider">
                        Set as default shipping address
                      </span>
                    </label>
                    <div className="pt-4 flex gap-4">
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-[#C5A059] text-[#4A3528] font-['Montserrat'] text-xs uppercase tracking-widest font-semibold hover:bg-[#E8D0A9] transition-all"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Wishlist Tab */}
        {tab === 'wishlist' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {wishlist.length === 0 ? (
              <div className="border border-[#C5A059]/20 p-12 text-center">
                <Heart size={36} className="text-[#C5A059]/30 mx-auto mb-4" />
                <p className="font-['Cormorant_Garamond'] text-2xl text-[#FDFBF7]/60 mb-4">
                  Your wishlist is empty
                </p>
                <Link
                  to="/collection"
                  className="inline-block px-8 py-3 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-xs uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#4A3528] transition-all"
                >
                  Explore The Collection
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlist.map((item) => (
                  <div
                    key={item._id}
                    className="border border-[#C5A059]/20 p-4 flex flex-col justify-between group hover:border-[#C5A059]/50 transition-colors"
                  >
                    <div>
                      <div className="aspect-[3/4] overflow-hidden relative mb-4">
                        <img
                          src={getImageUrl(item.images?.[0])}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <button
                          onClick={() => handleRemoveWishlist(item._id)}
                          className="absolute top-2 right-2 p-2 bg-[#4A3528]/80 text-[#FDFBF7]/70 hover:text-red-400 rounded-full backdrop-blur-sm transition-colors"
                          title="Remove from wishlist"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <Link to={`/product/${item._id}`}>
                        <h3 className="font-['Cormorant_Garamond'] text-xl font-bold text-[#FDFBF7] hover:text-[#C5A059] transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="font-['Montserrat'] text-xs text-[#C5A059] mt-1">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      className="mt-6 w-full py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-[11px] uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#4A3528] transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={14} /> Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
