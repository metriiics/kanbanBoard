import React, { useState, useEffect, useMemo, memo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { createPortal } from 'react-dom';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { getAssigneeDisplayName } from '../utils/taskMapper';

const KanbanTask = ({ task, index, columnId, columnTitle, onTaskClick, moveTaskInColumn }) => {
  const [showUserInfo, setShowUserInfo] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [avatarErrors, setAvatarErrors] = useState(new Set()); // Множество ID пользователей, у которых не загрузилась аватарка

  // Защита от undefined задачи - используем безопасные значения по умолчанию
  const safeTask = task || {};
  const taskId = safeTask.id || null;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#ffa940';
      case 'low': return '#52c41a';
      default: return 'transparent';
    }
  };

  // Функция для определения, нужен ли белый текст на фоне цвета
  const getTextColorForBackground = (hexColor) => {
    if (!hexColor) return '#172b4d'; // дефолтный темный цвет
    
    // Убираем # если есть
    const hex = hexColor.replace('#', '');
    
    // Конвертируем в RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Вычисляем яркость (luminance)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Если яркость меньше 0.5, используем белый текст, иначе темный
    return luminance < 0.5 ? '#ffffff' : '#172b4d';
  };

  // 🟣 Правильно деструктурируем preview из useDrag
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'task',
    item: { taskId: taskId, index, columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !!taskId, // Отключаем drag если нет taskId
  });

  // 🟢 Отключаем стандартное drag-превью
  useEffect(() => {
    if (taskId) {
      preview(getEmptyImage(), { captureDraggingState: true });
    }
  }, [preview, taskId]);

  const [, drop] = useDrop({
    accept: 'task',
    hover: (item) => {
      if (item.columnId === columnId && item.index !== index) {
        moveTaskInColumn(item.index, index, columnId);
        item.index = index;
      }
    },
  });

  const dragDropRef = (node) => {
    drag(node);
    drop(node);
  };

  const handleClick = () => {
    if (onTaskClick && typeof onTaskClick === 'function' && safeTask.id) {
      onTaskClick(safeTask, columnTitle);
    }
  };

  // Поддержка как нового формата (assignees), так и старого (assignee)
  const assignees = useMemo(() => {
    // Сначала проверяем новый формат assignees
    if (safeTask.assignees && Array.isArray(safeTask.assignees) && safeTask.assignees.length > 0) {
      return safeTask.assignees;
    }
    // Затем проверяем старый формат assignee
    if (safeTask.assignee && typeof safeTask.assignee === 'object' && safeTask.assignee.id) {
      return [safeTask.assignee];
    }
    return [];
  }, [safeTask.assignees, safeTask.assignee]);
  
  const dueDateValue = safeTask.dueDate || safeTask.due_date || null;
  const hasAssignees = assignees.length > 0;
  const hasDueDate = Boolean(dueDateValue);

  // Проверка, просрочена ли дата
  const isDateOverdue = () => {
    if (!dueDateValue) return false;
    const dueDate = new Date(dueDateValue);
    const today = new Date();
    // Сбрасываем время для сравнения только дат
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Показываем максимум 3 аватарки, остальные скрываем за "+N"
  const MAX_VISIBLE_AVATARS = 3;
  const visibleAssignees = useMemo(() => assignees.slice(0, MAX_VISIBLE_AVATARS), [assignees]);
  const hiddenCount = useMemo(() => Math.max(0, assignees.length - MAX_VISIBLE_AVATARS), [assignees.length]);

  // Сбрасываем ошибки при изменении задачи
  useEffect(() => {
    if (taskId) {
      setAvatarErrors(new Set());
    }
  }, [taskId, assignees]);

  // Защита от undefined задачи - возвращаем null после всех хуков
  if (!task || !task.id) {
    return null;
  }

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 180;
    const tooltipHeight = 80;

    let left = rect.right - tooltipWidth;
    let top = rect.top - tooltipHeight - 8;

    if (left < 8) left = rect.left;
    if (top < 0) top = rect.bottom + 8;

    setTooltipPos({ x: left, y: top });
    setShowUserInfo(true);
  };

  const handleMouseLeave = () => setShowUserInfo(false);

  return (
    <>
      <div
        ref={dragDropRef}
        className={`kanban-task ${isDragging ? 'task-dragging' : ''}`}
        onClick={handleClick}
      >
        {/* Индикатор приоритета */}
        {task.priority && (
          <span
            className="priority-indicator"
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          ></span>
        )}

        <div className="task-header">
          <div className="task-title-row">
            <h4 className="task-title">{task.title}</h4>
          </div>
        </div>

        {(hasDueDate || hasAssignees) && (
          <div className="task-footer">
            {hasDueDate && (
              <span 
                className={`task-date ${isDateOverdue() ? 'task-date-overdue' : ''}`}
              >
                {new Date(dueDateValue).toLocaleDateString('ru-RU')}
              </span>
            )}

            {hasAssignees && (
              <div className="task-assignees">
                {visibleAssignees.map((assignee, idx) => {
                  const assigneeName = getAssigneeDisplayName(assignee);
                  // Проверяем все возможные варианты имени поля
                  const avatarUrl = assignee?.avatar_url || assignee?.avatarUrl || null;
                  const avatarKey = `${assignee.id}-${idx}`;
                  const hasAvatarError = avatarErrors.has(assignee.id);
                  const shouldShowAvatar = avatarUrl && !hasAvatarError && avatarUrl.trim() !== '';
                  
                  return (
                    <div
                      key={avatarKey}
                      className="task-user"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const tooltipWidth = 180;
                        const tooltipHeight = 80;
                        let left = rect.right - tooltipWidth;
                        let top = rect.top - tooltipHeight - 8;
                        if (left < 8) left = rect.left;
                        if (top < 0) top = rect.bottom + 8;
                        setTooltipPos({ x: left, y: top });
                        setShowUserInfo(assignee);
                      }}
                      onMouseLeave={() => setShowUserInfo(null)}
                      style={{
                        marginLeft: idx > 0 ? '-8px' : '0',
                        position: 'relative',
                        zIndex: visibleAssignees.length - idx,
                      }}
                    >
                      {shouldShowAvatar ? (
                        <img
                          src={avatarUrl}
                          alt={assigneeName}
                          className="task-user-avatar"
                          style={{
                            width: '25px',
                            height: '25px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            display: 'block',
                          }}
                          onError={(e) => {
                            setAvatarErrors(prev => new Set(prev).add(assignee.id));
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className="task-user-avatar-fallback"
                          style={{
                            width: '25px',
                            height: '25px',
                            borderRadius: '50%',
                            backgroundColor: '#764ba2',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            border: '2px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}
                        >
                          {assigneeName ? assigneeName.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                  );
                })}
                {hiddenCount > 0 && (
                  <div
                    className="task-user-avatar-more"
                    style={{
                      width: '25px',
                      height: '25px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e0e0',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      border: '2px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      marginLeft: '-8px',
                      position: 'relative',
                      zIndex: 0,
                    }}
                    title={assignees.slice(MAX_VISIBLE_AVATARS).map(a => getAssigneeDisplayName(a)).join(', ')}
                  >
                    +{hiddenCount}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Теги — ниже даты */}
        {task.labels && task.labels.length > 0 && (
          <div className="task-tags">
            {task.labels.slice(0, 2).map((label, idx) => (
              <span
                key={label.id ?? `${label.name}-${idx}`}
                className="task-tag"
                style={label.color ? { 
                  backgroundColor: label.color,
                  color: getTextColorForBackground(label.color)
                } : {}}
              >
                {label.name}
              </span>
            ))}
            {task.labels.length > 2 && (
              <span className="task-tag task-tag-more">
                +{task.labels.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Tooltip через createPortal */}
        {showUserInfo && typeof showUserInfo === 'object' &&
          createPortal(
            <div
              className="user-tooltip"
              style={{
                position: 'fixed',
                top: tooltipPos.y,
                left: tooltipPos.x,
              }}
            >
              <p><strong>{getAssigneeDisplayName(showUserInfo)}</strong></p>
              {showUserInfo.username && <p>@{showUserInfo.username}</p>}
              {showUserInfo.email && <p className="user-email">{showUserInfo.email}</p>}
            </div>,
            document.body
          )}
      </div>

      {/* 🟣 Реалистичный drag-preview */}
      {isDragging &&
        createPortal(
          <div className="kanban-task drag-preview">
            {task.priority && (
              <span
                className="priority-indicator"
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              ></span>
            )}
            <div className="task-header">
              <h4 className="task-title">{task.title}</h4>
            </div>
            {(hasDueDate || hasAssignees) && (
              <div className="task-footer">
                {hasDueDate && (
                  <span className="task-date">
                    {new Date(dueDateValue).toLocaleDateString('ru-RU')}
                  </span>
                )}
                {hasAssignees && (
                  <div className="task-assignees" style={{ display: 'flex', gap: '-8px' }}>
                    {visibleAssignees.map((assignee, idx) => {
                      const assigneeName = getAssigneeDisplayName(assignee);
                      const avatarUrl = assignee?.avatar_url || null;
                      return avatarUrl ? (
                        <img
                          key={`${assignee.id}-${idx}`}
                          src={avatarUrl}
                          alt={assigneeName}
                          style={{
                            width: '25px',
                            height: '25px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid white',
                            marginLeft: idx > 0 ? '-8px' : '0',
                          }}
                        />
                      ) : (
                        <div
                          key={`${assignee.id}-${idx}`}
                          style={{
                            width: '25px',
                            height: '25px',
                            borderRadius: '50%',
                            backgroundColor: '#764ba2',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            border: '2px solid white',
                            marginLeft: idx > 0 ? '-8px' : '0',
                          }}
                        >
                          {assigneeName ? assigneeName.charAt(0).toUpperCase() : '?'}
                        </div>
                      );
                    })}
                    {hiddenCount > 0 && (
                      <div
                        style={{
                          width: '25px',
                          height: '25px',
                          borderRadius: '50%',
                          backgroundColor: '#e0e0e0',
                          color: '#666',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          border: '2px solid white',
                          marginLeft: '-8px',
                        }}
                      >
                        +{hiddenCount}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};

// Мемоизируем компонент для предотвращения лишних ререндеров
// Временно упрощаем мемоизацию - всегда ререндерим, если версия изменилась
export default memo(KanbanTask, (prevProps, nextProps) => {
  // Проверяем версию задачи для принудительного ререндера
  const prevVersion = prevProps.task._version || 0;
  const nextVersion = nextProps.task._version || 0;
  if (prevVersion !== nextVersion) {
    return false; // Версия изменилась - нужен ререндер
  }
  
  // Если версия не изменилась, проверяем основные поля
  // Если хотя бы одно поле изменилось, нужен ререндер
  if (prevProps.task.id !== nextProps.task.id) return false;
  if (prevProps.task.title !== nextProps.task.title) return false;
  if (prevProps.task.description !== nextProps.task.description) return false;
  if (prevProps.task.priority !== nextProps.task.priority) return false;
  if (prevProps.task.dueDate !== nextProps.task.dueDate && prevProps.task.due_date !== nextProps.task.due_date) return false;
  if (JSON.stringify(prevProps.task.labels || []) !== JSON.stringify(nextProps.task.labels || [])) return false;
  if (JSON.stringify(prevProps.task.assignee) !== JSON.stringify(nextProps.task.assignee)) return false;
  if (JSON.stringify(prevProps.task.assignees || []) !== JSON.stringify(nextProps.task.assignees || [])) return false;
  
  if (prevProps.index !== nextProps.index) return false;
  if (prevProps.columnId !== nextProps.columnId) return false;
  if (prevProps.columnTitle !== nextProps.columnTitle) return false;
  
  // Все одинаково - не нужен ререндер
  return true;
});