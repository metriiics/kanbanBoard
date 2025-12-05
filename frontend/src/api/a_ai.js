import { api } from './client';

export const chatWithAI = async (message, model = null) => {
  const payload = { message };
  if (model) {
    payload.model = model;
  }
  const response = await api.post("/api/ai/chat", payload);
  return response.data;
};

export const getAvailableModels = async () => {
  const response = await api.get("/api/ai/models");
  return response.data;
};

