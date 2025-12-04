import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from './PageLoader';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader message="Проверка доступа..." variant="full" />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}