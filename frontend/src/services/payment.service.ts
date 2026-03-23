import api from '@/lib/axios';
import { v4 as uuidv4 } from 'uuid';

export interface Order {
  _id: string;
  user: string;
  items: {
    product: {
      _id: string;
      name: string;
      price: number;
      images: string[];
    };
    quantity: number;
    price: number;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  totalAmount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'created' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayOrder {
  localOrderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export const paymentService = {
  createOrder: async (
    shippingAddress: Order['shippingAddress'],
    idempotencyKey?: string
  ): Promise<RazorpayOrder> => {
    const requestKey = idempotencyKey || uuidv4();
    const { data } = await api.post('/payment/create-order', {
      shippingAddress,
      idempotencyKey: requestKey,
    });
    const payload = data.data ?? data;

    return {
      localOrderId: payload.orderId ?? payload.localOrderId,
      razorpayOrderId: payload.razorpay_order_id ?? payload.razorpayOrderId,
      amount: payload.amount,
      currency: payload.currency ?? 'INR',
      keyId: payload.keyId ?? payload.key_id,
    };
  },

  verifyPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<Order> => {
    const { data } = await api.post('/payment/verify', payload);
    return data.data?.order ?? data.order ?? data.data;
  },

  getMyOrders: async (params?: { page?: number; limit?: number }): Promise<{
    orders: Order[];
    total: number;
    page: number;
    pages: number;
  }> => {
    const { data } = await api.get('/payment/orders/my', { params });
    const payload = data.data ?? data;
    return {
      orders: payload.orders ?? [],
      total: payload.pagination?.total ?? payload.total ?? 0,
      page: payload.pagination?.page ?? payload.page ?? 1,
      pages: payload.pagination?.totalPages ?? payload.pages ?? 1,
    };
  },

  getMyOrder: async (id: string): Promise<Order> => {
    const { data } = await api.get(`/payment/orders/my/${id}`);
    return data.data?.order ?? data.order ?? data.data;
  },
};
