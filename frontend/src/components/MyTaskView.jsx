import React, { useEffect, useState } from "react";
import { getUserTasksApi } from "../api/a_tasks";

export default function MyTaskView() {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");

  useEffect(() => {
    // Запрос к API для получения всех задач пользователя
    const fetchTasks = async () => {
      try {
        setTasksLoading(true);
        setTasksError("");
        // Без workspace_id - получаем все задачи пользователя
        const data = await getUserTasksApi(null);
        setTasks(data);
      } catch (error) {
        console.error("Ошибка при загрузке задач:", error);
        setTasksError("Не удалось загрузить задачи");
      }
      setTasksLoading(false);
    };

    fetchTasks();
  }, []);

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
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Нет назначенных задач 😕
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
