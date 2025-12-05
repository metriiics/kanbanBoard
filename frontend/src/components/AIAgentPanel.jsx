import React, { useState, useRef, useEffect } from 'react';
import '../css/AIAgentPanel.css';
import { chatWithAI } from '../api/a_ai';

const AIAgentPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Привет! Я ваш AI-ассистент. Чем могу помочь с вашей доской задач?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Автопрокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Фокус на input при открытии панели
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      // Вызов реального API для получения ответа от AI
      const response = await chatWithAI(messageText);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Ошибка при получении ответа от AI:', error);
      
      // Показываем сообщение об ошибке пользователю
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: error.response?.data?.detail || 'Произошла ошибка при обращении к AI. Проверьте, что Ollama запущена и доступна.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Автоматическое изменение размера textarea
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {isOpen && <div className="ai-panel-overlay" onClick={onClose} />}
      <div className={`ai-agent-panel ${isOpen ? 'open' : ''}`}>
        {/* Заголовок панели */}
        <div className="ai-panel-header">
          <div className="ai-panel-header-content">
            <div className="ai-panel-title">
              <div className="ai-icon">🤖</div>
              <div>
                <h2>AI Ассистент</h2>
                <p className="ai-panel-subtitle">Помощник по управлению задачами</p>
              </div>
            </div>
            <button className="ai-panel-close-btn" onClick={onClose} aria-label="Закрыть">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Область сообщений */}
        <div className="ai-panel-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message ${message.type === 'user' ? 'user-message' : 'ai-message-item'}`}
            >
              <div className="ai-message-content">
                {message.type === 'ai' && (
                  <div className="ai-avatar">
                    <span>🤖</span>
                  </div>
                )}
                <div className="ai-message-bubble">
                  <div className="ai-message-text">{message.content}</div>
                  <div className="ai-message-time">{formatTime(message.timestamp)}</div>
                </div>
                {message.type === 'user' && (
                  <div className="user-avatar">
                    <span>👤</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Индикатор печати */}
          {isTyping && (
            <div className="ai-message ai-message-item">
              <div className="ai-message-content">
                <div className="ai-avatar">
                  <span>🤖</span>
                </div>
                <div className="ai-message-bubble typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Быстрые действия */}
        <div className="ai-panel-quick-actions">
          <button
            className="quick-action-btn"
            onClick={() => setInputValue('Покажи мои задачи на сегодня')}
          >
            📋 Мои задачи
          </button>
          <button
            className="quick-action-btn"
            onClick={() => setInputValue('Какие задачи требуют внимания?')}
          >
            ⚠️ Срочные задачи
          </button>
          <button
            className="quick-action-btn"
            onClick={() => setInputValue('Помоги создать новую задачу')}
          >
            ➕ Создать задачу
          </button>
          <button
            className="quick-action-btn"
            onClick={() => setInputValue('Покажи статистику проекта')}
          >
            📊 Статистика
          </button>
        </div>

        {/* Поле ввода */}
        <div className="ai-panel-input-container">
          <form onSubmit={handleSendMessage} className="ai-panel-input-form">
            <textarea
              ref={inputRef}
              className="ai-panel-input"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Напишите ваш вопрос или запрос..."
              rows="1"
              disabled={isTyping}
            />
            <button
              type="submit"
              className="ai-panel-send-btn"
              disabled={!inputValue.trim() || isTyping}
              aria-label="Отправить сообщение"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <div className="ai-panel-input-hint">
            Нажмите Enter для отправки, Shift+Enter для новой строки
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAgentPanel;

