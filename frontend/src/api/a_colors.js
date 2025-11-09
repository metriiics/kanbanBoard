import { api } from './client';

export const getAvailableColors = async () => {
  const response = await api.get('/api/colors'); 
  return response.data;
};

export const updateColumnColor = async (columnId, colorId) => {
  const response = await api.put(`/api/columns/color/${columnId}`, {
    color_id: colorId,
  });
  return response.data;
};