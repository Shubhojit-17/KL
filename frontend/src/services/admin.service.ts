import api from '@/lib/axios';
import type { User } from './auth.service';
import type { Order } from './payment.service';

export interface AdminMetrics {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalUsers: number;
  recentOrders: Order[];
}

export const adminService = {
  getMetrics: async (): Promise<AdminMetrics> => {
    const { data } = await api.get('/admin/metrics');
    return data.data?.metrics;
  },

  getAllUsers: async (params?: { page?: number; limit?: number }): Promise<{
    users: User[];
    total: number;
    page: number;
    pages: number;
  }> => {
    const { data } = await api.get('/admin/users', { params });
    const payload = data.data ?? data;
    return {
      users: payload.users ?? [],
      total: payload.pagination?.total ?? payload.total ?? 0,
      page: payload.pagination?.page ?? payload.page ?? 1,
      pages: payload.pagination?.totalPages ?? payload.pages ?? 1,
    };
  },

  assignAdmin: async (email: string): Promise<void> => {
    await api.post('/admin/assign-admin', { email });
  },

  revokeAdmin: async (email: string): Promise<void> => {
    await api.post('/admin/revoke-admin', { email });
  },

  getAllOrders: async (params?: { page?: number; limit?: number }): Promise<{
    orders: Order[];
    total: number;
    page: number;
    pages: number;
  }> => {
    const { data } = await api.get('/admin/orders', { params });
    const payload = data.data ?? data;
    return {
      orders: payload.orders ?? [],
      total: payload.pagination?.total ?? payload.total ?? 0,
      page: payload.pagination?.page ?? payload.page ?? 1,
      pages: payload.pagination?.totalPages ?? payload.pages ?? 1,
    };
  },

  updateOrderStatus: async (
    id: string,
    status: string
  ): Promise<Order> => {
    const { data } = await api.put(`/admin/orders/${id}/status`, { orderStatus: status });
    return data.data?.order ?? data.order ?? data.data;
  },

  uploadProductImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data?.url;
  },
};
