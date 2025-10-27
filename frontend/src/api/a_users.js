import { api } from './client';

export const getCurrentUser = async () => {
  const response = await api.get('/api/users/me');
  return response.data;
};
