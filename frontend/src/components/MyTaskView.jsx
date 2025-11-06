import React, { useEffect, useState } from "react";

export default function MyTaskView() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    setTasks([
      {
        id: 1,
        title: "Настроить API",
        author: "Dmitro Sckrinik",
        status: "В процессе",
        created: "2025-10-18",
        deadline: "2025-10-25",
        project: "CRM-платформа",
      },
      {
        id: 2,
        title: "Сделать адаптивный дизайн",
        author: "Alexsey Go Pro",
        status: "На проверке",
        created: "2025-10-15",
        deadline: "2025-10-23",
        project: "UI-редизайн",
      },
      {
        id: 3,
        title: "Подключить WebSocket",
        author: "Angel",
        status: "Готово",
        created: "2025-10-10",
        deadline: "2025-10-20",
        project: "KanbanBoard",
      },
    ]);
  }, []);

  return (
    <div className="kanban-MyTask-board">
      <section className="my-tasks-board">
        <table className="tasks-table-board">
          <thead>
            <tr>
              <th>Задача</th>
              <th>Автор</th>
              <th>Статус</th>
              <th>Создано</th>
              <th>Дедлайн</th>
              <th>Проект</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.author}</td>
                <td>
                  <span
                    className={`status-badge-board ${task.status
                      .toLowerCase()
                      .replace(/\s/g, "-")}`}
                  >
                    {task.status}
                  </span>
                </td>
                <td>{task.created}</td>
                <td>{task.deadline}</td>
                <td>{task.project}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
