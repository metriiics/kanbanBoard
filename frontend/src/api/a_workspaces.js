import { api } from './client';

export const getProjectsByWorkspace = async (workspaceId) => {
  const response = await api.get(`/api/workspace/projects`, {
    params: workspaceId ? { workspace_id: workspaceId } : {},
  });
  return response.data;
};

// Получить текущее рабочее пространство пользователя
export async function getCurrentWorkspace(workspaceId) {
  const response = await api.get("/api/workspace/me", {
    params: workspaceId ? { workspace_id: workspaceId } : {},
    withCredentials: true,
  });
  return response.data;
}

export async function getUserWorkspaces() {
  const response = await api.get("/api/workspaces/my");
  return response.data;
}

export const getWorkspaceLabels = async (workspaceId) => {
  const response = await api.get("/api/workspace/labels", {
    params: workspaceId ? { workspace_id: workspaceId } : {},
  });
  return response.data;
};

export const createWorkspaceLabel = async (workspaceId, name, color) => {
  const response = await api.post("/api/workspace/labels", 
    { name, color },
    { params: workspaceId ? { workspace_id: workspaceId } : {} }
  );
  return response.data;
};