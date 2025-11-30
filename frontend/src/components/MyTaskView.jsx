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
                <th>Статус</th>
                <th>Создано</th>
                <th>Дедлайн</th>
                <th>Проект</th>
                <th>Пространство</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title || "Без названия"}</td>
                    <td>
                      <span
                        className={`status-badge-board ${(task.status || "")
                          .toLowerCase()
                          .replace(/\s/g, "-")}`}
                      >
                        {task.status || "-"}
                      </span>
                    </td>
                    <td>{formatDate(task.created_at)}</td>
                    <td>{formatDate(task.due_date)}</td>
                    <td>{task.project_title || "-"}</td>
                    <td>{task.workspace_name || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
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
