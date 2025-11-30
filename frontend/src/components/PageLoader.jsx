import React from 'react';

export default function PageLoader({ message = 'Загружаем данные...', variant = 'full' }) {
  return (
    <div className={`page-loader ${variant}`}>
      <div className="loader-container">
        <div className="loader-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <div className="loader-content">
          <p className="loader-message">{message}</p>
          <div className="loader-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

