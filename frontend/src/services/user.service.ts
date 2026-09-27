import api from '@/lib/axios';
import type { Product } from './product.service';

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  authProvider?: 'google' | 'local';
  addresses: Address[];
  createdAt?: string;
}

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await api.get('/user/profile');
    return data.data?.user ?? data.user;
  },

  updateProfile: async (name: string): Promise<UserProfile> => {
    const { data } = await api.put('/user/profile', { name });
    return data.data?.user ?? data.user;
  },

  getAddresses: async (): Promise<Address[]> => {
    const { data } = await api.get('/user/addresses');
    return data.data?.addresses ?? data.addresses ?? [];
  },

  addAddress: async (address: Omit<Address, '_id'>): Promise<{ address: Address; addresses: Address[] }> => {
    const { data } = await api.post('/user/addresses', address);
    return data.data;
  },

  updateAddress: async (id: string, address: Partial<Address>): Promise<{ address: Address; addresses: Address[] }> => {
    const { data } = await api.put(`/user/addresses/${id}`, address);
    return data.data;
  },

  deleteAddress: async (id: string): Promise<{ addresses: Address[] }> => {
    const { data } = await api.delete(`/user/addresses/${id}`);
    return data.data;
  },

  setDefaultAddress: async (id: string): Promise<{ addresses: Address[] }> => {
    const { data } = await api.put(`/user/addresses/${id}/default`);
    return data.data;
  },

  getWishlist: async (): Promise<Product[]> => {
    const { data } = await api.get('/user/wishlist');
    return data.data?.wishlist ?? [];
  },

  addToWishlist: async (productId: string): Promise<string[]> => {
    const { data } = await api.post(`/user/wishlist/${productId}`);
    return data.data?.wishlist ?? [];
  },

  removeFromWishlist: async (productId: string): Promise<string[]> => {
    const { data } = await api.delete(`/user/wishlist/${productId}`);
    return data.data?.wishlist ?? [];
  },
};
