import { api } from './client';

export const createProject = async (data) => {
  const response = await api.post("/api/projects/create", data, {
    withCredentials: true,
  });
  return response.data;
};

export const updateProjectTitle = async (projectId, title) => {
  const response = await api.put(`/api/projects/${projectId}/title`, { title });
  return response.data;
};