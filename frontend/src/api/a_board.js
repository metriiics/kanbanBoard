import { api } from './client';

export const getBoardColumns = async (boardId) => {
  const response = await api.get(`/api/boards/${boardId}/columns`);
  return response.data;
};

export const createBoard = async (data) => {
  const response = await api.post("/api/boards/create", data, {
    withCredentials: true,
  });
  return response.data;
};

export async function updateBoardTitle(boardId, title) {
  const response = await api.put(`/api/boards/${boardId}/title`, { title });
  return response.data;
}