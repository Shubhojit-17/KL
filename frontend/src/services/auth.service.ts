import api from '@/lib/axios';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  picture?: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

export const authService = {
  /** Send Google ID token to backend */
  googleLogin: async (idToken: string): Promise<User> => {
    const { data } = await api.post('/auth/google', { idToken });
    return data.data?.user ?? data.user;
  },

  /** Register with email and password */
  register: async (name: string, email: string, password: string): Promise<User> => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data.data?.user ?? data.user;
  },

  /** Login with email and password */
  login: async (email: string, password: string): Promise<User> => {
    const { data } = await api.post('/auth/login', { email, password });
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
