import React, { useEffect, useState } from "react";
import { getUserTasksApi } from "../api/a_tasks";
import { useWorkspaceContext } from "../contexts/WorkspaceContext";

export default function MyTaskView() {
  const { workspace, activeWorkspaceId } = useWorkspaceContext();
  const workspaceId = workspace?.id ?? activeWorkspaceId ?? null;
  
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");

  useEffect(() => {
    // Запрос к API для получения задач пользователя из активного рабочего пространства
    const fetchTasks = async () => {
      try {
        setTasksLoading(true);
        setTasksError("");
        // Передаем workspace_id для фильтрации задач по активному рабочему пространству
        const data = await getUserTasksApi(workspaceId);
        setTasks(data);
      } catch (error) {
        console.error("Ошибка при загрузке задач:", error);
        setTasksError("Не удалось загрузить задачи");
      }
      setTasksLoading(false);
    };

    fetchTasks();
  }, [workspaceId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU");
  };

  // Функция для определения контрастного цвета текста (черный или белый)
  const getContrastColor = (hexColor) => {
    if (!hexColor) return '#333';
    // Убираем # если есть
    const color = hexColor.replace('#', '');
    // Конвертируем в RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    // Вычисляем яркость
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    // Возвращаем черный или белый в зависимости от яркости
    return brightness > 155 ? '#333' : '#fff';
  };

  return (
    <div className="kanban-MyTask-board">
      <section className="my-tasks-board">
        {tasksLoading ? (
          <p>Загружаем задачи...</p>
        ) : tasksError ? (
          <p>{tasksError}</p>
        ) : (
          <table className="tasks-table-board">
            <thead>
              <tr>
                <th>Задача</th>
                <th>Приоритет</th>
                <th>Статус</th>
                <th>Создано</th>
                <th>Дедлайн</th>
                <th>Проект</th>
                <th>Автор</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length > 0 ? (
                tasks.map((task) => {
                  const getAuthorName = () => {
                    if (!task.author) {
                      return "-";
                    }
                    const firstName = task.author.first_name || "";
                    const lastName = task.author.last_name || "";
                    const username = task.author.username || "";
                    
                    if (firstName || lastName) {
                      const fullName = `${firstName} ${lastName}`.trim();
                      return fullName || username || "-";
                    }
                    return username || "-";
                  };

                  const getPriorityColor = (priority) => {
                    switch (priority) {
                      case 'high': return '#ff4d4f';
                      case 'medium': return '#ffa940';
                      case 'low': return '#52c41a';
                      default: return 'transparent';
                    }
                  };

                  const getPriorityLabel = (priority) => {
                    switch (priority) {
                      case 'high': return 'Высокий';
                      case 'medium': return 'Средний';
                      case 'low': return 'Низкий';
                      default: return '-';
                    }
                  };
                  
                  return (
                    <tr key={task.id}>
                      <td>{task.title || "Без названия"}</td>
                      <td>
                        {task.priority ? (
                          <span
                            className="priority-badge-board"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            {getPriorityLabel(task.priority)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <span
                          className="status-badge-board"
                          style={{
                            backgroundColor: task.status_color || '#f3f3f3',
                            color: getContrastColor(task.status_color || '#f3f3f3')
                          }}
                        >
                          {task.status || "-"}
                        </span>
                      </td>
                      <td>{formatDate(task.created_at)}</td>
                      <td>{formatDate(task.due_date)}</td>
                      <td>{task.project_title || "-"}</td>
                      <td title={getAuthorName()}>{getAuthorName()}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: 0, border: "none" }}>
                    <div className="empty-tasks-table">
                      <div className="empty-state-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 11l3 3L22 4"></path>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                      </div>
                      <h3 className="empty-state-title">Нет назначенных задач</h3>
                      <p className="empty-state-description">
                        Задачи, назначенные вам, будут отображаться здесь
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
