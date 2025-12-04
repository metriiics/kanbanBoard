import { api } from './client';

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export const getCurrentUser = async () => {
  const response = await api.get('/api/users/me');
  return response.data;
};

export const updateUser = async (userData) => {
  const formData = new FormData();
  
  // Добавляем только те поля, которые были изменены
  if (userData.first_name !== undefined) {
    formData.append('first_name', userData.first_name);
  }
  if (userData.last_name !== undefined) {
    formData.append('last_name', userData.last_name);
  }
  if (userData.username !== undefined) {
    formData.append('username', userData.username);
  }
  if (userData.avatar instanceof File) {
    formData.append('avatar', userData.avatar);
  }
  
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/users/me`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Ошибка обновления профиля');
  }
  
  return response.json();
};