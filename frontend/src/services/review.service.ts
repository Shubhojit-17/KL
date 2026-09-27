import api from '@/lib/axios';

export interface Review {
  _id: string;
  product: string;
  user: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  count: number;
  averageRating: number;
}

export const reviewService = {
  getProductReviews: async (productId: string): Promise<ReviewsResponse> => {
    const { data } = await api.get(`/products/${productId}/reviews`);
    return data.data;
  },

  createReview: async (
    productId: string,
    payload: { rating: number; title?: string; comment: string }
  ): Promise<Review> => {
    const { data } = await api.post(`/products/${productId}/reviews`, payload);
    return data.data?.review;
  },

  deleteReview: async (productId: string, reviewId: string): Promise<void> => {
    await api.delete(`/products/${productId}/reviews/${reviewId}`);
  },
};
