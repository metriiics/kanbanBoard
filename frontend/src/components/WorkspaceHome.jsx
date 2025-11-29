import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProjectsByWorkspace } from "../api/a_workspaces";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar"; 
import { useWorkspace } from "../hooks/h_workspace";

export default function WorkspaceHome() {
  const { user } = useAuth();
  const { workspace, workspaceLoading } = useWorkspace();
  const [recentProjects, setRecentProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Запрос к API для получения проектов
    const fetchProjects = async () => {
      if (!workspace?.id) {
        setRecentProjects([]);
        setProjectsLoading(false);
        return;
      }
      try {
        setProjectsLoading(true);
        setProjectsError("");
        const data = await getProjectsByWorkspace(workspace.id);
        setRecentProjects(data);
      } catch (error) {
        console.error("Ошибка при загрузке проектов:", error);
        setProjectsError("Не удалось загрузить проекты");
      }
      setProjectsLoading(false);
    };

    fetchProjects();

    // Временные данные для таблицы задач
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
  }, [workspace?.id]);

  return (
    <div className="kanban-board-with-sidebar">
      {/* Боковая панель */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Основной контент */}
      <div
        className={`board-content ${
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <div className="workspace-home">
          <header className="workspace-header">
            <h1>Добро пожаловать, {user?.first_name || user?.username} 👋</h1>
            <p>Вот ваши недавние проекты и активные задачи.</p>
          </header>

          {/* Недавние проекты */}
          <section className="recent-projects">
            <h2>Недавние проекты</h2>
            <div className="projects-grid">
              {projectsLoading || workspaceLoading ? (
                <p>Загружаем проекты...</p>
              ) : projectsError ? (
                <p>{projectsError}</p>
              ) : recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <Link
                    to={`/project/${project.id}/board`}
                    className="project-card"
                    key={project.id}
                  >
                    <h3>{project.name || project.title}</h3>
                    <p>{project.description || "Без описания"}</p>
                  </Link>
                ))
              ) : (
                <p>Нет недавних проектов 😕</p>
              )}
            </div>
          </section>

          {/* Мои задачи */}
          <section className="my-tasks">
            <h2>Мои задачи</h2>
            <table className="tasks-table">
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
                        className={`status-badge ${task.status
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
      </div>
    </div>
  );
}
