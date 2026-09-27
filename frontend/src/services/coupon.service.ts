import api from '@/lib/axios';

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiresAt?: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
}

export const couponService = {
  validateCoupon: async (code: string, amount: number): Promise<CouponValidationResult> => {
    const { data } = await api.post('/coupons/validate', { code, amount });
    return data.data;
  },

  getAllCoupons: async (): Promise<Coupon[]> => {
    const { data } = await api.get('/coupons/admin');
    return data.data?.coupons ?? [];
  },

  createCoupon: async (payload: {
    code: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    expiresAt?: string;
    usageLimit?: number;
  }): Promise<Coupon> => {
    const { data } = await api.post('/coupons/admin', payload);
    return data.data?.coupon;
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await api.delete(`/coupons/admin/${id}`);
  },

  toggleCoupon: async (id: string): Promise<Coupon> => {
    const { data } = await api.patch(`/coupons/admin/${id}/toggle`);
    return data.data?.coupon;
  },
};
