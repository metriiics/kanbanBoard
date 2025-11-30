import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProjectsByWorkspace } from "../api/a_workspaces";
import { getUserTasksApi } from "../api/a_tasks";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar"; 
import { useWorkspace } from "../hooks/h_workspace";
import WorkspaceLoaderWrapper from "./WorkspaceLoaderWrapper";

export default function WorkspaceHome() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [recentProjects, setRecentProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");
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

    // Запрос к API для получения задач пользователя
    const fetchTasks = async () => {
      if (!workspace?.id) {
        setTasks([]);
        setTasksLoading(false);
        return;
      }
      try {
        setTasksLoading(true);
        setTasksError("");
        const data = await getUserTasksApi(workspace.id);
        setTasks(data);
      } catch (error) {
        console.error("Ошибка при загрузке задач:", error);
        setTasksError("Не удалось загрузить задачи");
      }
      setTasksLoading(false);
    };

    fetchTasks();
  }, [workspace?.id]);

  // Определяем, нужно ли показывать общую загрузку
  const isLoading = projectsLoading || tasksLoading;
  
  // Ошибки проектов и задач не критичны - они обрабатываются локально в компоненте
  // Критические ошибки (workspace, projects, user) обрабатываются в WorkspaceLoaderWrapper

  return (
    <WorkspaceLoaderWrapper 
      additionalLoadingStates={[isLoading]}
    >
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
                {projectsError ? (
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
              {tasksError ? (
                <p>{tasksError}</p>
              ) : (
              <table className="tasks-table">
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
                    tasks.map((task) => {
                      const formatDate = (dateStr) => {
                        if (!dateStr) return "-";
                        const date = new Date(dateStr);
                        return date.toLocaleDateString("ru-RU");
                      };
                      
                      return (
                        <tr key={task.id}>
                          <td>{task.title || "Без названия"}</td>
                          <td>
                            <span
                              className={`status-badge ${(task.status || "")
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
                      );
                    })
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
      </div>
    </div>
    </WorkspaceLoaderWrapper>
  );
}
