import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { getCalendarTasks, getBoardColumnsList } from "../api/a_board";
import { createTaskApi, updateTaskApi } from "../api/a_tasks";
import { getWorkspaceMembers } from "../api/a_members";
import { getWorkspaceLabels } from "../api/a_workspaces";
import { useWorkspace } from "../hooks/h_workspace";
import TaskModal from "./TaskModal";

export default function CalendarView() {
  const { boardId } = useParams();
  const { workspace } = useWorkspace();
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [members, setMembers] = useState([]);
  const [labels, setLabels] = useState([]);
  
  // Фильтры
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  
  // Создание задачи
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCellRef, setSelectedCellRef] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskColumnId, setNewTaskColumnId] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const cellRefs = useRef({});

  // Загрузка данных
  useEffect(() => {
    if (!boardId) return;
    loadColumns();
  }, [boardId]);

  useEffect(() => {
    if (workspace?.id) {
      loadMembers();
      loadLabels();
    }
  }, [workspace?.id]);

  useEffect(() => {
    if (boardId) {
      loadTasks();
    }
  }, [boardId, currentDate, viewMode, filterStatus, filterAssignee, filterLabel]);

  const loadColumns = async () => {
    try {
      const data = await getBoardColumnsList(boardId);
      setColumns(data || []);
      if (data && data.length > 0 && !newTaskColumnId) {
        setNewTaskColumnId(data[0].id);
      }
    } catch (err) {
      console.error("Ошибка загрузки колонок:", err);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await getWorkspaceMembers(workspace?.id);
      setMembers(data || []);
    } catch (err) {
      console.error("Ошибка загрузки участников:", err);
    }
  };

  const loadLabels = async () => {
    try {
      const data = await getWorkspaceLabels(workspace?.id);
      setLabels(data || []);
    } catch (err) {
      console.error("Ошибка загрузки тегов:", err);
    }
  };

  const loadTasks = async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      let startDate, endDate;
      if (viewMode === "month") {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59);
      } else {
        const dayOfWeek = (currentDate.getDay() + 6) % 7;
        const monday = new Date(currentDate);
        monday.setDate(currentDate.getDate() - dayOfWeek);
        startDate = new Date(monday);
        endDate = new Date(monday);
        endDate.setDate(monday.getDate() + 6);
        endDate.setHours(23, 59, 59);
      }

      const filters = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      
      if (filterStatus) filters.columnId = parseInt(filterStatus);
      if (filterAssignee) filters.assignedTo = parseInt(filterAssignee);
      if (filterLabel) filters.labelId = parseInt(filterLabel);

      const data = await getCalendarTasks(boardId, filters);
      setTasks(data || []);
    } catch (err) {
      console.error("Ошибка загрузки задач:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const formatMonth = (date) =>
    date.toLocaleString("ru-RU", { month: "short", year: "numeric" });

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getTasksForDate = (date) => {
    const dateKey = formatDateKey(date);
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      const taskDateKey = formatDateKey(taskDate);
      return taskDateKey === dateKey;
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskColumnId || !selectedDate) return;

    try {
      const taskData = {
        title: newTaskTitle.trim(),
        column_id: parseInt(newTaskColumnId),
      };

      const newTask = await createTaskApi(taskData);
      
      // Обновляем задачу с датой
      if (selectedDate) {
        const dueDate = new Date(selectedDate);
        dueDate.setHours(12, 0, 0);
        await updateTaskApi(newTask.id, { due_date: dueDate.toISOString() });
      }

      setNewTaskTitle("");
      setIsCreatingTask(false);
      setSelectedDate(null);
      loadTasks();
    } catch (err) {
      console.error("Ошибка создания задачи:", err);
      alert("Не удалось создать задачу");
    }
  };

  const handleCellClick = (date, cellElement) => {
    setSelectedDate(date);
    setSelectedCellRef(cellElement);
    setIsCreatingTask(true);
  };

  const handleTaskClick = async (task) => {
    // Загружаем полные данные задачи для модального окна
    try {
      const { getTaskDetailsApi } = await import("../api/a_tasks");
      const taskDetails = await getTaskDetailsApi(task.id);
      setSelectedTask(taskDetails);
      setIsTaskModalOpen(true);
    } catch (err) {
      console.error("Ошибка загрузки задачи:", err);
      // Используем данные из календаря, если не удалось загрузить детали
      setSelectedTask(task);
      setIsTaskModalOpen(true);
    }
  };

  const today = new Date();

  // === Генерация дней ===
  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay + 6) % 7;

    const prevMonthDays = new Date(year, month, 0).getDate();
    const prevDays = Array.from({ length: offset }, (_, i) => ({
      date: new Date(year, month - 1, prevMonthDays - offset + i + 1),
      currentMonth: false,
    }));

    const currentDays = Array.from({ length: daysInMonth }, (_, i) => ({
      date: new Date(year, month, i + 1),
      currentMonth: true,
    }));

    const totalCells = 42;
    const nextDaysCount = totalCells - (prevDays.length + currentDays.length);
    const nextDays = Array.from({ length: nextDaysCount }, (_, i) => ({
      date: new Date(year, month + 1, i + 1),
      currentMonth: false,
    }));

    const allDays = [...prevDays, ...currentDays, ...nextDays];

    if (viewMode === "week") {
      const dayOfWeek = (currentDate.getDay() + 6) % 7;
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - dayOfWeek);
      return Array.from({ length: 7 }, (_, i) => ({
        date: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
        currentMonth: true,
      }));
    }

    return allDays;
  }, [currentDate, viewMode]);

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="calendar-container">
      {/* === ФИЛЬТРЫ === */}
      <div className="calendar-filters">
        <div className="filters-left">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Все статусы</option>
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
            ))}
          </select>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="">Все исполнители</option>
            {members.map((member) => {
              const name = `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.username || member.email;
              return (
                <option key={member.user_id} value={member.user_id}>
                  {name}
                </option>
              );
            })}
          </select>
          <select
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
          >
            <option value="">Все теги</option>
            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filters-right">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="month">Месяц</option>
            <option value="week">Неделя</option>
          </select>

          <div className="month-switcher">
            <button onClick={handlePrev}>
              <ChevronLeft size={18} />
            </button>
            <span>{formatMonth(currentDate)}</span>
            <button onClick={handleNext}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* === ХЕДЕР ДНЕЙ НЕДЕЛИ === */}
      <div
        className={`calendar-week-header ${
          viewMode === "week" ? "week-view" : ""
        }`}
      >
        {dayNames.map((d) => (
          <div key={d} className="calendar-day-header">
            {d}
          </div>
        ))}
      </div>

      {/* === СЕТКА === */}
      {loading ? (
        <div style={{ padding: "20px", textAlign: "center" }}>Загрузка...</div>
      ) : (
        <div
          className={`calendar-grid ${viewMode === "week" ? "week-view" : ""}`}
        >
          {days.map((d, index) => {
            const isToday =
              d.date.getDate() === today.getDate() &&
              d.date.getMonth() === today.getMonth() &&
              d.date.getFullYear() === today.getFullYear();

            const dayTasks = getTasksForDate(d.date);
            const isSelectedDate = selectedDate && formatDateKey(selectedDate) === formatDateKey(d.date);

            const cellKey = formatDateKey(d.date);
            const cellRef = (el) => {
              if (el) {
                cellRefs.current[cellKey] = el;
              }
            };

            return (
              <div
                key={index}
                ref={cellRef}
                className={`calendar-cell ${d.currentMonth ? "" : "inactive"} ${
                  isToday ? "today" : ""
                }`}
                onClick={() => handleCellClick(d.date, cellRefs.current[cellKey])}
              >
                <div className="day-number">{d.date.getDate()}</div>
                <div className="day-content">
                  {dayTasks.length > 0 && (
                    <div className="tasks-list">
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className="calendar-task-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                          title={task.title}
                        >
                          <span className="task-title">{task.title || "Без названия"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {dayTasks.length === 0 && (
                    <div className="add-task-hint">
                      <Plus size={14} />
                      <span>Добавить</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isTaskModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
            loadTasks();
          }}
        />
      )}

      {/* Portal для создания задачи */}
      {isCreatingTask && selectedCellRef && selectedDate && createPortal(
        <div 
          className="calendar-create-portal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreatingTask(false);
              setSelectedDate(null);
              setSelectedCellRef(null);
              setNewTaskTitle("");
            }
          }}
        >
          <div 
            className="calendar-create-portal"
            style={(() => {
              if (!selectedCellRef) return {};
              const rect = selectedCellRef.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              const portalHeight = 180; // Примерная высота portal
              const spaceBelow = viewportHeight - rect.bottom;
              const spaceAbove = rect.top;
              
              // Если места снизу недостаточно, но сверху достаточно - позиционируем сверху
              let top, left;
              if (spaceBelow < portalHeight && spaceAbove > portalHeight) {
                // Позиционируем сверху
                top = `${rect.top - portalHeight - 8}px`;
              } else {
                // Позиционируем снизу (по умолчанию)
                top = `${rect.bottom + 8}px`;
              }
              
              // Проверяем горизонтальные границы
              const portalWidth = Math.max(rect.width, 280);
              if (rect.left + portalWidth > window.innerWidth) {
                // Если не помещается справа, сдвигаем влево
                left = `${Math.max(8, window.innerWidth - portalWidth - 8)}px`;
              } else {
                left = `${rect.left}px`;
              }
              
              return {
                position: 'fixed',
                top,
                left,
                minWidth: `${Math.max(rect.width, 280)}px`,
                maxWidth: `${Math.min(rect.width * 1.5, 400)}px`,
              };
            })()}
            onClick={(e) => e.stopPropagation()}
          >
            <form
              className="calendar-task-form"
              onSubmit={handleCreateTask}
            >
              <input
                type="text"
                className="calendar-task-input"
                placeholder="Название задачи..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
              />
              <select
                className="calendar-task-select"
                value={newTaskColumnId}
                onChange={(e) => setNewTaskColumnId(e.target.value)}
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
              <div className="calendar-task-form-actions">
                <button
                  type="submit"
                  className="calendar-task-submit-btn"
                  disabled={!newTaskTitle.trim()}
                >
                  Создать
                </button>
                <button
                  type="button"
                  className="calendar-task-cancel-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsCreatingTask(false);
                    setSelectedDate(null);
                    setSelectedCellRef(null);
                    setNewTaskTitle("");
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
