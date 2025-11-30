import React from 'react';

export default function ErrorPage({ 
  title = 'Ошибка загрузки данных',
  message = 'Не удалось загрузить необходимые данные. Пожалуйста, попробуйте обновить страницу.',
  onRetry = null,
  errorDetails = null
}) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="error-page">
      <div className="error-page-container">
        <div className="error-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="error-title">{title}</h1>
        <p className="error-message">{message}</p>
        
        {errorDetails && (
          <div className="error-details">
            <details>
              <summary>Подробности об ошибке</summary>
              <pre>{typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2)}</pre>
            </details>
          </div>
        )}

        <div className="error-actions">
          <button className="error-retry-btn" onClick={handleRetry}>
            <span>Обновить страницу</span>
          </button>
        </div>
      </div>
    </div>
  );
}

