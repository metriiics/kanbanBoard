import { api } from './client';

export const getBoardColumns = async (boardId) => {
  const response = await api.get(`/api/boards/${boardId}/columns`);
  return response.data;
};

export const getBoardColumnsList = async (boardId) => {
  const response = await api.get(`/api/boards/${boardId}/columns/list`);
  return response.data;
};

export const getCalendarTasks = async (boardId, filters = {}) => {
  const params = {};
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;
  if (filters.columnId) params.column_id = filters.columnId;
  if (filters.assignedTo) params.assigned_to = filters.assignedTo;
  if (filters.labelId) params.label_id = filters.labelId;
  
  const response = await api.get(`/api/boards/${boardId}/calendar/tasks`, { params });
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