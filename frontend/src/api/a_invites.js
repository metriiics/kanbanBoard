import { api } from "./client";

export const getInviteInfo = async (token) => {
  const response = await api.get(`/api/invites/${token}`);
  return response.data;
};

export const acceptInvite = async (token) => {
  const response = await api.post(`/api/invites/accept/${token}`);
  return response.data;
};

export const getActiveInvite = async (workspaceId) => {
  const response = await api.get(`/api/invites/workspace/${workspaceId}`);
  return response.data;
};

export const createInviteLink = async (workspaceId) => {
  const response = await api.post(
    "/api/invites",
    null,
    {
      params: workspaceId ? { workspace_id: workspaceId } : {},
    }
  );
  return response.data;
};

export const deleteInviteLink = async (token) => {
  const response = await api.delete(`/api/invites/${token}`);
  return response.data;
};

export const sendWorkspaceInvite = async ({ workspaceId, userId }) => {
  const response = await api.post("/api/invites/send", {
    workspace_id: workspaceId,
    user_id: userId,
  });
  return response.data;
};

