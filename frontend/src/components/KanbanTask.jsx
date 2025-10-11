import React from 'react';

export default function KanbanTask({ task }) {
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  return (
    <div className="kanban-task" draggable="true">
      {/* Приоритет */}
      <div className={`task-priority ${getPriorityClass(task.priority)}`}></div>
      
      {/* Заголовок задачи */}
      <div className="task-header">
        <h4 className="task-title">{task.title}</h4>
      </div>
      
      {/* Описание */}
      <p className="task-description">{task.description}</p>
      
      {/* Мета-информация */}
      <div className="task-meta">
        <span className="task-type">Задача</span>
        <div className="task-actions">
          <button className="task-action-btn">👤</button>
          <button className="task-action-btn">💬</button>
          <button className="task-action-btn">📎</button>
        </div>
      </div>
    </div>
  );
}