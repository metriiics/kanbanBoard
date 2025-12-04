import { api } from "./client";

export const getWorkspaceMembers = async (workspaceId) => {
  const response = await api.get("/api/workspace/members", {
    params: workspaceId ? { workspace_id: workspaceId } : {},
  });
  return response.data;
};

export const removeWorkspaceMember = async ({ workspaceId, userId }) => {
  const response = await api.delete(`/api/workspace/members/${userId}`, {
    params: workspaceId ? { workspace_id: workspaceId } : {},
  });
  return response.data;
};

export const updateMemberRole = async ({ workspaceId, userId, role }) => {
  const response = await api.put(`/api/workspace/members/${userId}/role`, 
    { role },
    {
      params: workspaceId ? { workspace_id: workspaceId } : {},
    }
  );
  return response.data;
};

export const updateMemberProjects = async ({ workspaceId, userId, projectIds }) => {
  const response = await api.put(`/api/workspace/members/${userId}/projects`,
    { project_ids: projectIds },
    {
      params: workspaceId ? { workspace_id: workspaceId } : {},
    }
  );
  return response.data;
};

