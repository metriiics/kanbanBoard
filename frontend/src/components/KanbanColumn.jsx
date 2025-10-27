import React, { useRef, useState } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import KanbanTask from "./KanbanTask";

export default function KanbanColumn({ column, onUpdateColumns, index, onTaskClick, moveColumn, moveTaskInColumn, moveTaskBetweenColumns, onAddTask }) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const taskCount = column.tasks.length;

  const ref = useRef(null);
  
 // drag для самой колонки
  const [{ isDragging }, drag] = useDrag({
    type: 'column',
    item: { type: 'column', id: column.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    options: {
    // ограничивает перетаскивание только по горизонтали
      dragPreviewOffset: { x: 0, y: 0 },
    },
  });

  // универсальный drop — обрабатывает и таски, и колонки
  const [{ isOver }, drop] = useDrop({
    accept: ['task', 'column'], 
    hover: (item, monitor) => {
      // --- если перетаскивается колонка ---
      if (monitor.getItemType() === 'column') {
        const dragIndex = item.index;
        const hoverIndex = index;
        if (!ref.current || dragIndex === hoverIndex) return;

        const hoverRect = ref.current.getBoundingClientRect();
        const hoverMiddleX = (hoverRect.right - hoverRect.left) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientX = clientOffset.x - hoverRect.left;

        if (
          (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) ||
          (dragIndex > hoverIndex && hoverClientX > hoverMiddleX)
        ) {
          return;
        }

        moveColumn(dragIndex, hoverIndex);
        item.index = hoverIndex;
      }

      // --- если перетаскивается задача ---
      if (monitor.getItemType() === 'task' && item.columnId !== column.id) {
        moveTaskBetweenColumns(item.taskId, item.columnId, column.id);
        item.columnId = column.id;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // объединяем drag+drop
  drag(drop(ref));

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
      ref={ref}
      className={`kanban-column ${isDragging ? 'column-dragging' : ''} ${isOver ? 'column-drop-target' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div className="column-header">

        <div ref={drag} className="column-drag-handle" title="Перетащить колонку">
          ⋮⋮
        </div>

        <div className="column-title">
          <h3>{column.title}</h3>
          <span className="task-count">{column.tasks.length}</span>
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
            moveTaskInColumn={moveTaskInColumn}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <div className="column-footer">
        {!isAddingTask ? (
          <button className="add-task-btn" onClick={() => setIsAddingTask(true)}>
            + Добавить задачу
          </button>
        ) : (
          <div className="add-task-form">
            <textarea
              className="new-task-input"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Введите название задачи..."
              rows="3"
              autoFocus
            />
            <div className="add-task-actions">
              <button
                className="btn btn-primary btn-small"
                onClick={() => {
                  if (!newTaskTitle.trim()) return;
                  onAddTask(column.id, { id: Date.now(), title: newTaskTitle });
                  setNewTaskTitle('');
                  setIsAddingTask(false);
                }}
              >
                Добавить
              </button>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setIsAddingTask(false)}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}