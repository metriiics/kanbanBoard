import { api } from './client';

export const updateColumnsPositions = async (payload) => {
  const response = await api.put('/api/columns/update_positions', payload);
  return response.data;
};

export const updateColumnTitle = async (columnId, title) => {
  const response = await api.put(`/api/columns/${columnId}/title`, { title });
  return response.data;
};

export const createColumn = async (data) => {
  const response = await api.post('/api/columns', data, {
    withCredentials: true,
  });
  return response.data;
};