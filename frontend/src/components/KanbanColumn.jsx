import React from 'react';
import KanbanTask from "../components/KanbanTask";

export default function KanbanColumn({ column, onUpdateColumns }) {
  const taskCount = column.tasks.length;

  return (
    <div className="kanban-column">
      {/* Заголовок колонки */}
      <div className="column-header">
        <div className="column-title">
          <h3>{column.title}</h3>
          <span className="task-count">{taskCount}</span>
        </div>
        <button className="column-menu">⋯</button>
      </div>

      {/* Контейнер задач */}
      <div className="tasks-container">
        {column.tasks.map(task => (
          <KanbanTask 
            key={task.id} 
            task={task} 
          />
        ))}
      </div>

      {/* Футер колонки */}
      <div className="column-footer">
        <button className="add-task-btn">+ Добавить задачу</button>
      </div>
    </div>
  );
}