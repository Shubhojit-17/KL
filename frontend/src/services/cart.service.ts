import api from '@/lib/axios';

export interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
  quantity: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
}

export const cartService = {
  getCart: async (): Promise<Cart> => {
    const { data } = await api.get('/cart');
    return data.data?.cart ?? data.cart ?? data.data;
  },

  addToCart: async (productId: string, quantity: number = 1): Promise<Cart> => {
    const { data } = await api.post('/cart/add', { productId, quantity });
    return data.data?.cart ?? data.cart ?? data.data;
  },

  updateCartItem: async (productId: string, quantity: number): Promise<Cart> => {
    const { data } = await api.put(`/cart/item/${productId}`, { quantity });
    return data.data?.cart ?? data.cart ?? data.data;
  },

  removeFromCart: async (productId: string): Promise<Cart> => {
    const { data } = await api.delete(`/cart/item/${productId}`);
    return data.data?.cart ?? data.cart ?? data.data;
  },

  clearCart: async (): Promise<void> => {
    await api.delete('/cart');
  },
};
