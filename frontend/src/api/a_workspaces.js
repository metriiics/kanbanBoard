import { api } from './client';

export const getProjectsByWorkspace = async () => {
  const response = await api.get(`/api/workspace/projects`);
  return response.data;
};

// Получить текущее рабочее пространство пользователя
export async function getCurrentWorkspace() {
  const response = await api.get("/api/workspace/me", {
    withCredentials: true,
  });
  return response.data;
}