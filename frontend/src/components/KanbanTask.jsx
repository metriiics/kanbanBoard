import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import Avatar from 'react-avatar';
import { createPortal } from 'react-dom';
import { getEmptyImage } from 'react-dnd-html5-backend';

export default function KanbanTask({ task, index, columnId, columnTitle, onTaskClick, moveTaskInColumn }) {
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
        moveTaskInColumn(item.index, columnId, index, columnId);
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

  const assignee = task.assignee || {
    name: 'Иван Иванов',
    role: 'Менеджер проекта',
    email: 'ivan.ivanov@company.ru',
  };

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

        {task.description && <p className="task-description">{task.description}</p>}

        {/* Нижний блок: дата и аватар */}
        <div className="task-footer">
          <span className="task-date">
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString('ru-RU')
              : '20.11.2025'}
          </span>

          <div
            className="task-user"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Avatar
              name={assignee.name}
              size="25"
              round={true}
              textSizeRatio={2}
              color="#764ba2"
            />
          </div>
        </div>

        {/* Теги — ниже даты */}
        {task.labels && task.labels.length > 0 && (
          <div className="task-tags">
            {task.labels.slice(0, 2).map((label, i) => (
              <span key={i} className="task-tag">{label}</span>
            ))}
            {task.labels.length > 2 && (
              <span className="task-tag task-tag-more">
                +{task.labels.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Tooltip через createPortal */}
        {showUserInfo &&
          createPortal(
            <div
              className="user-tooltip"
              style={{
                position: 'fixed',
                top: tooltipPos.y,
                left: tooltipPos.x,
              }}
            >
              <p><strong>{assignee.name}</strong></p>
              <p>{assignee.role}</p>
              <p className="user-email">{assignee.email}</p>
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
            {task.description && <p className="task-description">{task.description}</p>}
            <div className="task-footer">
              <span className="task-date">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString('ru-RU')
                  : '20.11.2025'}
              </span>
              <Avatar name={assignee.name} size="25" round={true} color="#764ba2" />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}