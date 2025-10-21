import { api } from './client';

const API_URL = 'http://localhost:8000'; // URL FastAPI

export const getProjectsByWorkspace = async (workspaceId) => {
  const response = await api.get(`/workspaces/${workspaceId}/projects`);
  return response.data;
};