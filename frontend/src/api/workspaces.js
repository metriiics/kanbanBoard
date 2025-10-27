import { api } from './client';

export const getProjectsByWorkspace = async () => {
  const response = await api.get(`/api/workspace/projects`);
  return response.data;
};