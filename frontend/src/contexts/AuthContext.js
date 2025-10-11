import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Для FastAPI используется проверка токена через /users/me
        const response = await fetch('http://localhost:8000/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);

      // fastapi эндпоинт для логина
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // fastapi возвращает access_token и user данные
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.detail || 'Ошибка авторизации');
        return { success: false, error: data.detail };
      }
    } catch (error) {
      setError('Ошибка сети');
      return { success: false, error: 'Ошибка сети' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (first_name, last_name, username, email, password) => {
    try {
      setError('');
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, last_name, username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.detail || 'Ошибка регистрации');
        return { success: false };
      }
    } catch {
      setError('Ошибка сети');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError('');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    error,
    setError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}