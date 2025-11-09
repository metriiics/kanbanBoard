import { api } from './client';

export const createTaskApi = async (payload) => {
  const response = await api.post("/api/tasks", payload);
  return response.data;
};

export const updateTaskApi = async (taskId, payload) => {
  const response = await api.put(`/api/tasks/${taskId}`, payload);
  return response.data;
};