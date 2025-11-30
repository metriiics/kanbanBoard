import React, { useState, useEffect, memo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { createPortal } from 'react-dom';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { getAssigneeDisplayName } from '../utils/taskMapper';

const KanbanTask = ({ task, index, columnId, columnTitle, onTaskClick, moveTaskInColumn }) => {
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#ffa940';
      case 'low': return '#52c41a';
      default: return 'transparent';
    }
  };

  // 🟣 Правильно деструктурируем preview из useDrag
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'task',
    item: { taskId: task.id, index, columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // 🟢 Отключаем стандартное drag-превью
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

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
    if (onTaskClick && typeof onTaskClick === 'function') {
      onTaskClick(task, columnTitle);
    }
  };

  const assignee = task.assignee;
  const dueDateValue = task.dueDate || task.due_date || null;
  const hasAssignee = Boolean(assignee);
  const hasDueDate = Boolean(dueDateValue);
  const assigneeName = getAssigneeDisplayName(assignee);
  const [avatarError, setAvatarError] = useState(false);

  // Получаем URL аватара - используем напрямую из базы данных
  const avatarUrl = assignee?.avatar_url || null;

  // Сбрасываем ошибку при изменении задачи
  useEffect(() => {
    setAvatarError(false);
  }, [task.id, avatarUrl]);

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

        {(hasDueDate || hasAssignee) && (
          <div className="task-footer">
            {hasDueDate && (
              <span className="task-date">
                {new Date(dueDateValue).toLocaleDateString('ru-RU')}
              </span>
            )}

            {hasAssignee && (
              <div
                className="task-user"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {avatarUrl && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt={assigneeName}
                    className="task-user-avatar"
                    style={{
                      width: '25px',
                      height: '25px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                    onError={() => setAvatarError(true)}
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
                    }}
                  >
                    {assigneeName ? assigneeName.charAt(0).toUpperCase() : '?'}
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
                style={label.color ? { backgroundColor: label.color } : {}}
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
        {showUserInfo && hasAssignee &&
          createPortal(
            <div
              className="user-tooltip"
              style={{
                position: 'fixed',
                top: tooltipPos.y,
                left: tooltipPos.x,
              }}
            >
              <p><strong>{assigneeName}</strong></p>
              {assignee.username && <p>@{assignee.username}</p>}
              {assignee.email && <p className="user-email">{assignee.email}</p>}
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
            {(hasDueDate || hasAssignee) && (
              <div className="task-footer">
                {hasDueDate && (
                  <span className="task-date">
                    {new Date(dueDateValue).toLocaleDateString('ru-RU')}
                  </span>
                )}
                {hasAssignee && (
                  avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={assigneeName}
                      style={{
                        width: '25px',
                        height: '25px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
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
                      }}
                    >
                      {assigneeName ? assigneeName.charAt(0).toUpperCase() : '?'}
                    </div>
                  )
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
export default memo(KanbanTask, (prevProps, nextProps) => {
  // Сравниваем только необходимые поля
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.task.due_date === nextProps.task.due_date &&
    JSON.stringify(prevProps.task.labels) === JSON.stringify(nextProps.task.labels) &&
    JSON.stringify(prevProps.task.assignee) === JSON.stringify(nextProps.task.assignee) &&
    prevProps.index === nextProps.index &&
    prevProps.columnId === nextProps.columnId &&
    prevProps.columnTitle === nextProps.columnTitle
  );
});