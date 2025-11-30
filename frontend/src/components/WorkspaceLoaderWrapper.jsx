import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace, useProjects } from '../hooks/h_workspace';
import { useCurrentUser } from '../hooks/h_useCurrentUser';
import PageLoader from './PageLoader';
import ErrorPage from './ErrorPage';

// Константы для задержек
const MIN_LOADING_TIME = 800; // Минимальное время показа загрузки (мс)
const ERROR_CHECK_DELAY = 500; // Задержка перед проверкой ошибок после завершения загрузки (мс)

/**
 * Обёртка для компонентов, которая показывает общую страницу загрузки
 * пока не загрузятся все необходимые данные, или страницу ошибки при ошибках
 */
export default function WorkspaceLoaderWrapper({ children, additionalLoadingStates = [], additionalErrors = [] }) {
  const { workspaceLoading, workspaceListLoading, workspaceError, workspaceListError } = useWorkspace();
  const { loading: projectsLoading, error: projectsError } = useProjects();
  const { loading: userLoading, error: userError } = useCurrentUser();

  const [showLoader, setShowLoader] = useState(true);
  const [canShowError, setCanShowError] = useState(false);
  const loadingStartTimeRef = useRef(Date.now());
  const minLoadingTimerRef = useRef(null);
  const errorCheckTimerRef = useRef(null);

  // Проверяем все состояния загрузки
  const isLoading = 
    workspaceLoading || 
    workspaceListLoading || 
    projectsLoading ||
    userLoading ||
    additionalLoadingStates.some(state => state === true);

  // Сбрасываем время начала загрузки при новой загрузке
  useEffect(() => {
    if (isLoading) {
      loadingStartTimeRef.current = Date.now();
      setCanShowError(false);
    }
  }, [isLoading]);

  // Управляем минимальным временем показа загрузки
  useEffect(() => {
    // Очищаем предыдущие таймеры
    if (minLoadingTimerRef.current) {
      clearTimeout(minLoadingTimerRef.current);
      minLoadingTimerRef.current = null;
    }
    if (errorCheckTimerRef.current) {
      clearTimeout(errorCheckTimerRef.current);
      errorCheckTimerRef.current = null;
    }

    if (isLoading) {
      setShowLoader(true);
      setCanShowError(false);
      loadingStartTimeRef.current = Date.now();
      return;
    }

    // После завершения загрузки ждем минимальное время
    const elapsed = Date.now() - loadingStartTimeRef.current;
    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

    minLoadingTimerRef.current = setTimeout(() => {
      setShowLoader(false);
      
      // После скрытия загрузки, ждем еще немного перед проверкой ошибок
      errorCheckTimerRef.current = setTimeout(() => {
        setCanShowError(true);
      }, ERROR_CHECK_DELAY);
    }, remainingTime);

    return () => {
      if (minLoadingTimerRef.current) {
        clearTimeout(minLoadingTimerRef.current);
      }
      if (errorCheckTimerRef.current) {
        clearTimeout(errorCheckTimerRef.current);
      }
    };
  }, [isLoading]);

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

  // Если загружается или еще показываем загрузку, показываем индикатор загрузки
  if (isLoading || showLoader) {
    return <PageLoader message="Загружаем данные..." variant="full" />;
  }

  // Если есть критические ошибки и можно показывать ошибку, показываем страницу ошибки
  const criticalErrors = allErrors.filter(e => e.critical);
  if (criticalErrors.length > 0 && canShowError) {
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

  // Если нет ошибок и всё загружено, показываем контент
  return <>{children}</>;
}

