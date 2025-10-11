import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import KanbanColumn from "./KanbanColumn";
import KanbanTask from "./KanbanTask";
import Sidebar from "./Sidebar";

export default function KanbanBoard() {
  const { id } = useParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [columns, setColumns] = useState([
    {
      id: 1,
      title: 'TO DO',
      tasks: [
        { id: 1, title: 'Создать дизайн', description: 'Разработать макет приложения', priority: 'high' },
        { id: 2, title: 'Настроить API', description: 'Подключить бэкенд', priority: 'medium' }
      ]
    },
    {
      id: 2,
      title: 'IN PROGRESS',
      tasks: [
        { id: 3, title: 'Разработка фронтенда', description: 'Создать React компоненты', priority: 'high' }
      ]
    },
    {
      id: 3,
      title: 'REVIEW',
      tasks: []
    },
    {
      id: 4,
      title: 'DONE',
      tasks: [
        { id: 4, title: 'Инициализация проекта', description: 'Создать базовую структуру', priority: 'low' }
      ]
    }
  ]);

  return (
    <div className="kanban-board-with-sidebar">
      {/* Боковое меню */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Основная доска */}
      <div className={`board-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="kanban-board">
          {/* Хедер доски */}
          <div className="board-header">
            <h1>Доска #{id}</h1>
            <div className="board-actions">
              <button className="btn btn-primary">Добавить задачу</button>
              <button className="btn btn-secondary">Фильтры</button>
            </div>
          </div>

          {/* Контейнер колонок */}
          <div className="columns-container">
            {columns.map(column => (
              <KanbanColumn 
                key={column.id} 
                column={column}
                onUpdateColumns={setColumns}
              />
            ))}
            
            {/* Кнопка добавления новой колонки */}
            <div className="add-column">
              <button className="add-column-btn">+ Добавить колонку</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}