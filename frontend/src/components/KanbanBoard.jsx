import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import KanbanColumn from "./KanbanColumn";
import TaskModal from "./TaskModal";
import KanbanTask from "./KanbanTask";
import Sidebar from "./Sidebar";
import useBoard from "../hooks/h_useBoard"; 
import CalendarView from './CalendarView';
import MyTaskView from './MyTaskView';

export default function KanbanBoard() {
  const { boardId } = useParams();
  const { columns, setColumns, projectData, loading, error, saveColumnPositions, saveColumnTitle, onAddTask } = useBoard(boardId);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('board'); // Активный пункт навигации
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalRightAligned, setIsModalRightAligned] = useState(false);

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  if (loading) return <div className="loading">Загрузка доски...</div>;
  if (error) return <div className="error">Ошибка: {error.message}</div>;
  if (!projectData) return <div className="empty">Нет данных по доске</div>;

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

  const moveColumn = (dragIndex, hoverIndex) => {
    if (dragIndex === hoverIndex) return;

    setColumns(prevColumns => {
      const updatedColumns = [...prevColumns];
      const [movedColumn] = updatedColumns.splice(dragIndex, 1);
      updatedColumns.splice(hoverIndex, 0, movedColumn);

      // обновляем позицию локально
      const reordered = updatedColumns.map((col, i) => ({ ...col, position: i }));

      // Сохраняем позиции на сервере (fire-and-forget)
      saveColumnPositions(reordered);

      return reordered;
    });
  };

  const handleAddColumn = (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    const newColumn = {
      id: Date.now(), // временный id
      title: newColumnTitle,
      tasks: [],
      position: columns.length,
    };

    setColumns((prev) => [...prev, newColumn]);
    setNewColumnTitle("");
    setIsAddingColumn(false);
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
            {columns.map((column, index) => (
              <KanbanColumn 
                key={column.id} 
                column={column}
                index={index}   
                moveColumn={moveColumn}
                moveTaskBetweenColumns={moveTaskBetweenColumns}
                moveTaskInColumn={moveTaskInColumn}
                onTaskClick={handleTaskClick}
                onAddTask={onAddTask}
                onUpdateColumns={setColumns}
                saveColumnTitle={saveColumnTitle}
              />
            ))}
            
            {/* 🔹 Блок добавления новой колонки */}
            <div className="add-column">
              {isAddingColumn ? (
                <form onSubmit={handleAddColumn} className="add-column-form">
                  <input
                    type="text"
                    placeholder="Введите название колонки..."
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    autoFocus
                  />
                  <div className="add-column-actions">
                    <button type="submit" className="btn-save">
                      Добавить
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setIsAddingColumn(false)}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="add-column-btn"
                  onClick={() => setIsAddingColumn(true)}
                >
                  + Добавить колонку
                </button>
              )}
            </div>
          </div>
        );
      case 'my-tasks':
        return <MyTaskView />;
      case 'calendar':
        return <CalendarView />;
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