import React from 'react';
import { useWorkspace, useProjects } from '../hooks/h_workspace';
import { useCurrentUser } from '../hooks/h_useCurrentUser';
import PageLoader from './PageLoader';
import ErrorPage from './ErrorPage';

/**
 * Обёртка для компонентов, которая показывает общую страницу загрузки
 * пока не загрузятся все необходимые данные, или страницу ошибки при ошибках
 */
export default function WorkspaceLoaderWrapper({ children, additionalLoadingStates = [], additionalErrors = [] }) {
  const { workspaceLoading, workspaceListLoading, workspaceError, workspaceListError } = useWorkspace();
  const { loading: projectsLoading, error: projectsError } = useProjects();
  const { loading: userLoading, error: userError } = useCurrentUser();

  // Проверяем все состояния загрузки
  const isLoading = 
    workspaceLoading || 
    workspaceListLoading || 
    projectsLoading ||
    userLoading ||
    additionalLoadingStates.some(state => state === true);

  // Собираем все ошибки
  const allErrors = [];
  
  // Критические ошибки (блокируют работу приложения)
  if (workspaceError) {
    allErrors.push({
      type: 'workspace',
      message: workspaceError,
      critical: true
    });
  }

  if (userError) {
    allErrors.push({
      type: 'user',
      message: 'Не удалось загрузить данные пользователя',
      details: userError,
      critical: true
    });
  }

  // Ошибки проектов (критическая, так как без проектов приложение не работает)
  if (projectsError) {
    allErrors.push({
      type: 'projects',
      message: 'Не удалось загрузить проекты',
      details: projectsError,
      critical: true
    });
  }

  // Не критичные ошибки (не блокируют работу)
  if (workspaceListError) {
    allErrors.push({
      type: 'workspaceList',
      message: workspaceListError,
      critical: false
    });
  }

  // Добавляем дополнительные ошибки
  additionalErrors.forEach((error, index) => {
    if (error) {
      allErrors.push({
        type: `additional_${index}`,
        message: typeof error === 'string' ? error : 'Произошла ошибка',
        details: typeof error !== 'string' ? error : null,
        critical: true
      });
    }
  });

  // Если есть критические ошибки, показываем страницу ошибки
  const criticalErrors = allErrors.filter(e => e.critical);
  if (criticalErrors.length > 0 && !isLoading) {
    const primaryError = criticalErrors[0];
    return (
      <ErrorPage
        title="Ошибка загрузки данных"
        message={primaryError.message}
        errorDetails={primaryError.details}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Если загружается, показываем загрузку
  if (isLoading) {
    return <PageLoader message="Загружаем данные..." variant="full" />;
  }

  // Если нет ошибок и всё загружено, показываем контент
  return <>{children}</>;
}

