import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import KanbanTask from "./KanbanTask";

export default function KanbanColumn({ column, onUpdateColumns, onTaskClick, moveTaskInColumn, moveTaskBetweenColumns, onAddTask }) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const taskCount = column.tasks.length;

  // Настройка drop target для колонки
  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item) => {
      // Если задача перемещается из другой колонки
      if (item.columnId !== column.id) {
        moveTaskBetweenColumns(item.taskId, item.columnId, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

    // Функция для добавления новой задачи
  const handleAddTask = () => {

    console.log('handleAddTask вызвана в колонке:', column.id);

    if (newTaskTitle.trim()) {
      const newTask = {
        id: Date.now(), // Временный ID, в реальном приложении нужно генерировать на сервере
        title: newTaskTitle.trim(),
        description: '',
        priority: 'medium',
        assignee: '',
        dueDate: '',
        labels: [],
        createdAt: new Date().toISOString()
      };

      console.log('Создана задача:', newTask);
      
      // Вызываем функцию из пропсов для добавления задачи
      if (onAddTask) {
        console.log('Вызываю onAddTask');
        onAddTask(column.id, newTask);
      }

      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  // Функция для отмены добавления
  const handleCancelAdd = () => {
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  // Обработчик нажатия Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    } else if (e.key === 'Escape') {
      handleCancelAdd();
    }
  };

  return (
    <div 
      ref={drop}
      className={`kanban-column ${isOver ? 'column-drop-target' : ''}`}
    >
      <div className="column-header">
        <div className="column-title">
          <h3>{column.title}</h3>
          <span className="task-count">{taskCount}</span>
        </div>
        <button className="column-menu">⋯</button>
      </div>

      <div className="tasks-container">
        {column.tasks.map((task, index) => (
          <KanbanTask 
            key={task.id} 
            task={task}
            index={index}
            columnId={column.id}
            columnTitle={column.title}
            onTaskClick={onTaskClick}
            moveTask={moveTaskInColumn}
          />
        ))}

        {/* Форма добавления новой задачи */}
        {isAddingTask && (
          <div className="add-task-form">
            <textarea
              className="new-task-input"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Введите название задачи..."
              autoFocus
              rows="3"
            />
            <div className="add-task-actions">
              <button 
                className="btn btn-primary btn-small"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                Добавить
              </button>
              <button 
                className="btn btn-secondary btn-small"
                onClick={handleCancelAdd}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="column-footer">
        {!isAddingTask ? (
          <button 
            className="add-task-btn"
            onClick={() => setIsAddingTask(true)}
          >
            + Добавить задачу
          </button>
        ) : null}
      </div>
    </div>
  );
}