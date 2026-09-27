import api from '@/lib/axios';

export const contactService = {
  submitInquiry: async (payload: { name: string; email: string; message: string }): Promise<void> => {
    await api.post('/contact', payload);
  },
};
