import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import KanbanColumn from "./KanbanColumn";
import TaskModal from "./TaskModal";
import KanbanTask from "./KanbanTask";
import Sidebar from "./Sidebar";

export default function KanbanBoard() {
  const { id } = useParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('board'); // Активный пункт навигации
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalRightAligned, setIsModalRightAligned] = useState(false);

  // Пример данных проекта и доски
  const projectData = {
    name: 'Разработка Kanban доски',
    boardName: 'Активная разработка'
  };

// Функция для добавления задачи в колонку
const addTaskToColumn = (columnId, newTask) => {
  setColumns(prevColumns => {
    const newColumns = [...prevColumns];
    const column = newColumns.find(col => col.id === columnId);
    
    if (column) {
      column.tasks.push(newTask);
    }
    
    return newColumns;
  });
};

// Сделаем функцию доступной глобально для KanbanColumn (временное решение)
React.useEffect(() => {
  window.addTaskToColumn = addTaskToColumn;
  return () => {
    window.addTaskToColumn = null;
  };
}, []);

  // Функция для перемещения задачи между колонками
  const moveTaskBetweenColumns = (taskId, fromColumnId, toColumnId) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      
      const fromColumn = newColumns.find(col => col.id === fromColumnId);
      const toColumn = newColumns.find(col => col.id === toColumnId);
      
      if (!fromColumn || !toColumn) return prevColumns;
      
      // Находим задачу
      const taskIndex = fromColumn.tasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) return prevColumns;
      
      // Перемещаем задачу
      const [task] = fromColumn.tasks.splice(taskIndex, 1);
      toColumn.tasks.push(task);
      
      return newColumns;
    });
  };

  // Функция для изменения порядка задач в колонке
  const moveTaskInColumn = (dragIndex, hoverIndex, columnId) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const column = newColumns.find(col => col.id === columnId);
      
      if (!column) return prevColumns;
      
      // Меняем порядок задач
      const [movedTask] = column.tasks.splice(dragIndex, 1);
      column.tasks.splice(hoverIndex, 0, movedTask);
      
      return newColumns;
    });
  };

  // Функция для открытия задачи
  const handleTaskClick = (task, columnTitle) => {
    setSelectedTask({ ...task, columnTitle });
    setIsModalOpen(true);
  };

  // Функция для закрытия модалки
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  // Функция для переключения позиции модалки
  const handleToggleAlignment = () => {
    setIsModalRightAligned(!isModalRightAligned);
  };

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

  const navItems = [
    { key: 'board', label: 'Доска' },
    { key: 'my-tasks', label: 'Мои задачи' },
    { key: 'calendar', label: 'Календарь' },
    { key: 'documents', label: 'Документы' }
  ];

  const renderContent = () => {
    switch (activeNav) {
      case 'board':
        return (
          <div className="columns-container">
            {columns.map(column => (
              <KanbanColumn 
                key={column.id} 
                column={column}
                moveTaskBetweenColumns={moveTaskBetweenColumns}
                moveTaskInColumn={moveTaskInColumn}
                onTaskClick={handleTaskClick}
              />
            ))}
            <div className="add-column">
              <button className="add-column-btn">+ Добавить колонку</button>
            </div>
          </div>
        );
      case 'my-tasks':
        return <div className="content-placeholder">Мои задачи - скоро здесь будет список ваших задач</div>;
      case 'calendar':
        return <div className="content-placeholder">Календарь - скоро здесь будет календарь задач</div>;
      case 'documents':
        return <div className="content-placeholder">Документы - скоро здесь будут документы проекта</div>;
      default:
        return null;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="kanban-board-with-sidebar">
        {/* Боковое меню */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        {/* Основная доска */}
        <div className={`board-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="kanban-board">
            {/* Заголовки проекта и доски */}
            <div className="project-header">
              <div className="project-info">
                <h1 className="project-name">{projectData.name}</h1>
                <h2 className="board-name">{projectData.boardName}</h2>
              </div>
            </div>

            {/* Навигационная панель */}
            <nav className="board-navbar">
              {navItems.map(item => (
                <button
                  key={item.key}
                  className={`nav-item ${activeNav === item.key ? 'active' : ''}`}
                  onClick={() => setActiveNav(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Основной контент */}
            <div className="board-main-content">
              {renderContent()}
            </div>
          </div>
        </div>

        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          isRightAligned={isModalRightAligned}
          onToggleAlignment={handleToggleAlignment}
        />
      </div>
    </DndProvider>
  );
}