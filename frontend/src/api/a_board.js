import { api } from './client';

export const getBoardColumns = async (boardId) => {
  const response = await api.get(`/api/boards/${boardId}/columns`);
  return response.data;
};

export const getTaskDetails = async (taskId) => {
  const response = await api.get(`/api/tasks/${taskId}`);
  return response.data;
};
