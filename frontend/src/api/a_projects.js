import { api } from './client';

export const createProject = async (data) => {
  const response = await api.post("/api/projects/create", data, {
    withCredentials: true,
  });
  return response.data;
};
