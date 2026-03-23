import api from '@/lib/axios';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category?: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

export const productService = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
  }): Promise<ProductsResponse> => {
    const { data } = await api.get('/products', { params });
    const payload = data.data ?? data;
    return {
      products: payload.products ?? [],
      total: payload.pagination?.total ?? payload.total ?? 0,
      page: payload.pagination?.page ?? payload.page ?? 1,
      pages: payload.pagination?.totalPages ?? payload.pages ?? 1,
    };
  },

  getProduct: async (id: string): Promise<Product> => {
    const { data } = await api.get(`/products/${id}`);
    return data.data?.product ?? data.product ?? data.data;
  },

  // Admin
  getAllProductsAdmin: async (): Promise<Product[]> => {
    const { data } = await api.get('/products/admin/all');
    return data.data?.products ?? data.products ?? data.data;
  },

  createProduct: async (product: Partial<Product>): Promise<Product> => {
    const { data } = await api.post('/products', product);
    return data.data?.product ?? data.product ?? data.data;
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    const { data } = await api.put(`/products/${id}`, product);
    return data.data?.product ?? data.product ?? data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
