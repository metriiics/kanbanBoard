import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import KanbanColumn from "./KanbanColumn";
import TaskModal from "./TaskModal";
import KanbanTask from "./KanbanTask";
import Sidebar from "./Sidebar";
import AIAgentPanel from "./AIAgentPanel";
import useBoard from "../hooks/h_useBoard"; 
import CalendarView from './CalendarView';
import MyTaskView from './MyTaskView';
import { normalizeTaskCard } from "../utils/taskMapper";
import { useTasks } from "../hooks/h_useTasks";
import { createColumn } from "../api/a_columns";

export default function KanbanBoard() {
  const { boardId } = useParams();
  const { columns, setColumns, projectData, loading, error, saveColumnPositions, saveColumnTitle, onAddTask, refetch } = useBoard(boardId);
  const { updateTask } = useTasks();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('board'); // Активный пункт навигации
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalRightAligned, setIsModalRightAligned] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const handleTaskUpdated = useCallback((updatedTask) => {
    if (!updatedTask?.id) return;

    // Нормализуем задачу для карточки на доске
    const normalizedCard = normalizeTaskCard(updatedTask);

    setColumns((prevColumns) => {
      let taskFound = false;
      let hasChanges = false;
      
      const nextColumns = prevColumns.map((column) => {
        const taskIndex = column.tasks.findIndex((t) => t.id === updatedTask.id);
        if (taskIndex === -1) {
          return column; // Возвращаем тот же объект, если задача не найдена
        }
        taskFound = true;
        const existingTask = column.tasks[taskIndex];
        
        // Проверяем, есть ли реальные изменения
        const newTitle = normalizedCard.title || existingTask.title;
        const newPriority = normalizedCard.priority ?? existingTask.priority;
        const newDueDate = normalizedCard.dueDate || normalizedCard.due_date || existingTask.dueDate || existingTask.due_date;
        const newLabels = normalizedCard.labels && normalizedCard.labels.length > 0 ? normalizedCard.labels : existingTask.labels;
        const newAssignee = normalizedCard.assignee || existingTask.assignee;
        
        // Проверяем, изменилось ли что-то
        const titleChanged = newTitle !== existingTask.title;
        const priorityChanged = newPriority !== existingTask.priority;
        const dueDateChanged = newDueDate !== (existingTask.dueDate || existingTask.due_date);
        const labelsChanged = JSON.stringify(newLabels) !== JSON.stringify(existingTask.labels);
        const assigneeChanged = JSON.stringify(newAssignee) !== JSON.stringify(existingTask.assignee);
        
        if (!titleChanged && !priorityChanged && !dueDateChanged && !labelsChanged && !assigneeChanged) {
          return column; // Нет изменений - возвращаем тот же объект
        }
        
        hasChanges = true;
        const updatedTasks = [...column.tasks];
        
        // Обновляем только измененную задачу
        updatedTasks[taskIndex] = { 
          ...existingTask,
          title: newTitle,
          priority: newPriority,
          dueDate: newDueDate,
          due_date: newDueDate,
          labels: newLabels,
          assignee: newAssignee,
          column_id: normalizedCard.column_id || existingTask.column_id,
        };
        
        return { ...column, tasks: updatedTasks };
      });

      // Возвращаем предыдущее состояние, если не было изменений
      return (taskFound && hasChanges) ? nextColumns : prevColumns;
    });

    setSelectedTask((prev) => {
      if (!prev || prev.id !== updatedTask.id) return prev;
      const normalized = normalizeTaskCard(updatedTask);
      // Проверяем, есть ли изменения
      if (
        prev.title === normalized.title &&
        prev.priority === normalized.priority &&
        JSON.stringify(prev.labels) === JSON.stringify(normalized.labels) &&
        JSON.stringify(prev.assignee) === JSON.stringify(normalized.assignee)
      ) {
        return prev; // Нет изменений
      }
      return {
        ...prev,
        ...normalized,
        columnTitle: updatedTask.column?.title ?? updatedTask.columnTitle ?? prev.columnTitle,
      };
    });
  }, [setColumns]);

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  if (loading) return <div className="loading">Загрузка доски...</div>;
  if (error) return <div className="error">Ошибка: {error.message}</div>;
  if (!projectData) return <div className="empty">Нет данных по доске</div>;

  // Функция для перемещения задачи между колонками
  const moveTaskBetweenColumns = async (taskId, fromColumnId, toColumnId) => {
    // Оптимистичное обновление UI
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
      // Обновляем column_id в задаче
      const updatedTask = { ...task, column_id: toColumnId };
      toColumn.tasks.push(updatedTask);
      
      return newColumns;
    });

    // Сохраняем на сервере
    try {
      await updateTask(taskId, { column_id: toColumnId });
    } catch (err) {
      console.error("Ошибка при сохранении перемещения задачи:", err);
      // Откатываем изменения при ошибке
      setColumns(prevColumns => {
        const newColumns = [...prevColumns];
        const fromColumn = newColumns.find(col => col.id === fromColumnId);
        const toColumn = newColumns.find(col => col.id === toColumnId);
        
        if (!fromColumn || !toColumn) return prevColumns;
        
        const taskIndex = toColumn.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return prevColumns;
        
        const [task] = toColumn.tasks.splice(taskIndex, 1);
        fromColumn.tasks.push(task);
        
        return newColumns;
      });
    }
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

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim() || !boardId) return;

    try {
      // Создаем колонку на сервере
      const columnData = {
        title: newColumnTitle.trim(),
        position: columns.length,
        board_id: parseInt(boardId),
      };

      await createColumn(columnData);

      // Перезагружаем данные с сервера, чтобы получить полную структуру колонки (с цветом и т.д.)
      await refetch();

      setNewColumnTitle("");
      setIsAddingColumn(false);
    } catch (error) {
      console.error("Ошибка при создании колонки:", error);
      alert("Не удалось создать колонку. Попробуйте позже.");
    }
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
              <button
                className="ai-agent-btn"
                onClick={() => setIsAIPanelOpen(true)}
                aria-label="Открыть AI ассистента"
                title="AI Ассистент"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
                <span>AI Ассистент</span>
              </button>
            </div>

            {/* Декоративная полоса */}
            <div className="board-divider"></div>

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
          onTaskUpdated={handleTaskUpdated}
        />

        <AIAgentPanel
          isOpen={isAIPanelOpen}
          onClose={() => setIsAIPanelOpen(false)}
        />
      </div>
    </DndProvider>
  );
}