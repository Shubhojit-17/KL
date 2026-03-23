import api from '@/lib/axios';
import type { User } from './auth.service';
import type { Order } from './payment.service';

export const adminService = {
  getAllUsers: async (): Promise<User[]> => {
    const { data } = await api.get('/admin/users');
    return data.data?.users ?? data.users ?? data.data;
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
};
