import { api } from './client';

export const getAvailableColors = async () => {
  const response = await api.get('/api/colors'); 
  return response.data;
};