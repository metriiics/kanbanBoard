import React, { useEffect, useState } from "react";
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
        // Сортируем проекты по дате создания (новые первыми)
        const sortedProjects = [...data].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
          const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
          return dateB - dateA; // Убывание: новые первыми
        });
        setRecentProjects(sortedProjects);
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
                  recentProjects.slice(0, 5).map((project) => (
                    <div
                      className="project-card"
                      key={project.id}
                    >
                      <div className="project-card-accent"></div>
                      <div className="project-card-content">
                        <h3>{project.name || project.title}</h3>
                        {project.description && (
                          <p className="project-card-description">{project.description}</p>
                        )}
                      </div>
                    </div>
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
              ) : tasks.length === 0 ? (
                <p>Нет назначенных задач 😕</p>
              ) : (
              <table className="tasks-table">
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
                    tasks.slice(0, 7).map((task) => {
                      const formatDate = (dateStr) => {
                        if (!dateStr) return "-";
                        const date = new Date(dateStr);
                        return date.toLocaleDateString("ru-RU");
                      };
                      
                      const getAuthorName = () => {
                        if (!task.author) return "-";
                        if (task.author.first_name || task.author.last_name) {
                          return `${task.author.first_name || ""} ${task.author.last_name || ""}`.trim() || task.author.username || "-";
                        }
                        return task.author.username || "-";
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
                        <tr key={task.id}>
                          <td>{task.title || "Без названия"}</td>
                          <td>
                            {task.priority ? (
                              <span
                                className="priority-badge"
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
                              className="status-badge"
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
                          <td>{getAuthorName()}</td>
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
      </div>
    </div>
    </WorkspaceLoaderWrapper>
  );
}
