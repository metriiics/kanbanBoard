import React from 'react';
import { useDrag, useDrop } from 'react-dnd';

export default function KanbanTask({ task, index, columnId, columnTitle, onTaskClick, moveTaskInColumn }) {
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  // Настройка drag source для задачи
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { 
      taskId: task.id, 
      index, 
      columnId 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Настройка drop target для задачи (для изменения порядка в той же колонке)
  const [, drop] = useDrop({
    accept: 'task',
    hover: (item) => {
      if (item.columnId === columnId && item.index !== index) {
        moveTaskInColumn(item.index, columnId, index, columnId);
        item.index = index;
      }
    },
  });

  // Объединяем drag и drop refs
  const dragDropRef = (node) => {
    drag(node);
    drop(node);
  };

  // Добавляем безопасный обработчик
  const handleClick = () => {
    if (onTaskClick && typeof onTaskClick === 'function') {
      onTaskClick(task, columnTitle);
    }
  };

  return (
    <div 
      ref={dragDropRef}
      className={`kanban-task ${isDragging ? 'task-dragging' : ''}`}
      onClick={handleClick}
    >
      
      <div className="task-header">
        <h4 className="task-title">{task.title}</h4>
      </div>
      
      <p className="task-description">{task.description}</p>
      
      <div className="task-meta">
        <span className="task-type">08.20.20</span>
        <div className="task-actions">
          <button className="task-action-btn">👤</button>
        </div>
      </div>
    </div>
  );
}