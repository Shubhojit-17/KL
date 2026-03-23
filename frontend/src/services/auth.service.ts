import api from '@/lib/axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  picture?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export const authService = {
  /** Send Google ID token to backend */
  googleLogin: async (idToken: string): Promise<User> => {
    const { data } = await api.post('/auth/google', { idToken });
    return data.data?.user ?? data.user;
  },

  /** Get current authenticated user */
  getMe: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    return data.data?.user ?? data.user;
  },

  /** Logout – clears cookies */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /** Refresh access token */
  refresh: async (): Promise<void> => {
    await api.post('/auth/refresh');
  },
};
