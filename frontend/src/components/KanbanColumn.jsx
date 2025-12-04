import React, { useRef, useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useDrop, useDrag } from 'react-dnd';
import { useColors } from '../hooks/h_useColors';
import KanbanTask from "./KanbanTask";

const KanbanColumn = ({ 
  column, 
  onUpdateColumns, 
  index, 
  onTaskClick, 
  moveColumn, 
  moveTaskInColumn, 
  moveTaskBetweenColumns, 
  onAddTask,
  onDeleteColumn,
  saveColumnTitle }) => {
    
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);
  const [color, setColor] = useState(column.color || '#f3f3f3');
  const taskCount = column.tasks.length;

  const [showColorModal, setShowColorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { colors, loading: colorsLoading, saveColumnColor } = useColors();

  const ref = useRef(null);
  const menuRef = useRef(null);

  // закрытие меню по клику вне его
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
 // drag для колонки
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
      if (monitor.getItemType() === 'task' && item.columnId !== column.id && item.taskId) {
        // Предотвращаем множественные вызовы
        if (item.lastColumnId !== column.id) {
          // Проверяем, что задача еще существует в исходной колонке
          moveTaskBetweenColumns(item.taskId, item.columnId, column.id);
          item.columnId = column.id;
          item.lastColumnId = column.id;
        }
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
        labels: ['Общее'],
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

  // Изменение названия колонки
  const handleTitleEdit = () => {
    setIsEditingTitle(true);
    setEditedTitle(column.title);
  };

  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    const trimmed = editedTitle.trim();
    if (!trimmed || trimmed === column.title) return;

    try {
      await saveColumnTitle(column.id, trimmed);
    } catch {
      alert('Ошибка при сохранении названия колонки');
    }
  };

  // Изменение цвета
  const handleColorChange = async (colorId) => {
    const selectedColor = colors.find(c => c.id === colorId);
    if (!selectedColor) return;

    try {
      // ✅ Обновляем локально
      onUpdateColumns(prev =>
        prev.map(col =>
          col.id === column.id ? { ...col, color: selectedColor } : col
        )
      );
      setShowColorModal(false);

      // ✅ Сохраняем в БД через хук
      await saveColumnColor(column.id, colorId);
    } catch (err) {
      alert('Ошибка при сохранении цвета. Попробуйте позже.');
    }
  };

  const confirmDelete = () => {
    if (onDeleteColumn) onDeleteColumn(column.id);
    setShowDeleteModal(false);
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

  const currentColor = column.color?.hex_code || '#f3f3f3';

  return (
    <div
      ref={ref}
      className={`kanban-column ${isDragging ? 'column-dragging' : ''} ${isOver ? 'column-drop-target' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div className="column-header" style={{ backgroundColor: currentColor  }}>

        <div ref={drag} className="column-drag-handle" title="Перетащить колонку">
          ⋮⋮
        </div>

        <div className="column-title">
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              autoFocus
              className="column-title-input"
            />
          ) : (
            <h3 onClick={handleTitleEdit} title="Нажмите, чтобы переименовать">
              {column.title}
            </h3>
          )}
          <span className="task-count">{column.tasks.length}</span>
        </div>

        <button
          className="column-menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          ref={menuRef}
        >
          ⋯
        </button>

        {isMenuOpen && (
          <div className="column-dropdown" ref={menuRef}>
            <button onClick={handleTitleEdit}>Переименовать</button>
            <button onClick={() => setShowColorModal(true)}>Цвет</button>
            <button className="delete-column-btn" onClick={() => setShowDeleteModal(true)}>
              Удалить
            </button>
          </div>
        )}
      </div>

      <div className="tasks-container">
        {column.tasks.filter(task => task && task.id).map((task, index) => (
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
              rows="2"
              autoFocus
            />
            <div className="add-task-actions">
              <button
                className="btn btn-primary btn-small"
                onClick={async () => {
                  if (!newTaskTitle.trim()) return;
                  await onAddTask(column.id, { title: newTaskTitle });
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
      
      {/* === МОДАЛКА: выбор цвета (через Portal) === */}
      {showColorModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowColorModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3>Выберите цвет</h3>
            {colorsLoading ? (
              <div>Загрузка цветов...</div>
            ) : (
              <div className="color-picker-modal">
                {colors.map((color) => (
                  <div
                    key={color.id}
                    className={`color-dot ${column.color?.id === color.id ? 'active' : ''}`}
                    style={{ backgroundColor: color.hex_code }}
                    onClick={() => handleColorChange(color.id)}
                    title={color.name}
                  />
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button type="button" onClick={() => setShowColorModal(false)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* === МОДАЛКА: подтверждение удаления (через Portal) === */}
      {showDeleteModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3>Удаление колонки</h3>
            <p style={{ textAlign: 'center', marginBottom: '16px', color: '#94a3b8' }}>
              Вы уверены, что хотите удалить колонку «{column.title}»?
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowDeleteModal(false)}>
                Отмена
              </button>
              <button type="submit" onClick={confirmDelete}>
                Удалить
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Мемоизируем компонент для предотвращения лишних ререндеров
export default memo(KanbanColumn, (prevProps, nextProps) => {
  // Сравниваем только необходимые поля
  return (
    prevProps.column.id === nextProps.column.id &&
    prevProps.column.title === nextProps.column.title &&
    prevProps.column.tasks.length === nextProps.column.tasks.length &&
    prevProps.index === nextProps.index &&
    JSON.stringify(prevProps.column.color) === JSON.stringify(nextProps.column.color)
  );
});