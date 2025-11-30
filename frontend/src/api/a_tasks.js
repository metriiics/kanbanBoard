import { api } from './client';

export const createTaskApi = async (payload) => {
  const response = await api.post("/api/tasks", payload);
  return response.data;
};

export const getTaskDetailsApi = async (taskId) => {
  const response = await api.get(`/api/tasks/${taskId}/details`);
  return response.data;
};

export const updateTaskApi = async (taskId, payload) => {
  const response = await api.put(`/api/tasks/${taskId}`, payload);
  return response.data;
};

export const createCommentApi = async (taskId, content) => {
  const response = await api.post(`/api/tasks/${taskId}/comments`, { content });
  return response.data;
};

export const getUserTasksApi = async (workspaceId = null) => {
  const params = workspaceId ? { workspace_id: workspaceId } : {};
  const response = await api.get("/api/users/me/tasks", { params });
  return response.data;
};