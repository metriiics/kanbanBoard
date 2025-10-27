import { api } from './client';

export const updateColumnsPositions = async (payload) => {
  const response = await api.put('/api/columns/update_positions', payload);
  return response.data;
};

