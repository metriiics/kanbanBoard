import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useProjects } from '../hooks/h_workspace';
import { useCurrentUser } from '../hooks/h_useCurrentUser';

export default function Sidebar({ isCollapsed, onToggle }) {
  const [expandedProjects, setExpandedProjects] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const location = useLocation();
  const { id } = useParams();

  const [projectTitle, setProjectTitle] = useState('');
  const [boardTitle, setBoardTitle] = useState('');

  const { projects, loading, error } = useProjects();
  const { user, loading: userLoading } = useCurrentUser();
  const workspaceName = user?.username || 'Загрузка...';

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleCreateProject = (e) => {
    e.stopPropagation();
    setShowProjectModal(true);
  };

  const handleCreateBoard = (e) => {
    e.stopPropagation();
    if (!selectedProject) return;
    setShowBoardModal(true);
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    console.log('Создать проект:', projectTitle);
    // TODO: вызывать API (например useCreateProject hook)
    setShowProjectModal(false);
    setProjectTitle('');
  };

  const handleBoardSubmit = async (e) => {
    e.preventDefault();
    console.log('Создать доску:', boardTitle, 'в проекте:', selectedProject?.id);
    // TODO: вызывать API (например useCreateBoard hook)
    setShowBoardModal(false);
    setBoardTitle('');
  };

  const isBoardActive = (boardId) => {
    return location.pathname.includes(`/boards/${boardId}`);
  };

  if (loading) return <div className="sidebar">Загрузка...</div>;
  if (error) return <div className="sidebar">Ошибка загрузки проектов {error.message || JSON.stringify(error, null, 2)}</div>;

  if (isCollapsed) {
    return (
      <div className="sidebar collapsed">
        <div className="sidebar-header">
          <button className="toggle-btn" onClick={onToggle}>
            ☰
          </button>
        </div>
        <div className="sidebar-content">
          <div className="workspace-icon">
            <span title={workspaceName}>🏢</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="workspace-info">
            <h3>{workspaceName}</h3>
          </div>
          <button className="toggle-btn" onClick={onToggle}>
            ◀
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-sections">

            {/* === ПРОЕКТЫ === */}
            <div className="section">
              <div className="section-header">
                <h4 className="section-title">ПРОЕКТЫ</h4>
                <button
                  className="create-btn"
                  onClick={handleCreateProject}
                  title="Создать проект"
                >
                  +
                </button>
              </div>

              {projects.map((project) => (
                <div key={project.id} className="project-item">
                  <div
                    className={`project-header ${
                      selectedProject?.id === project.id ? 'selected' : ''
                    }`}
                    onClick={() => handleProjectClick(project)}
                  >
                    <span className="project-icon">📁</span>
                    <span className="project-name">{project.title}</span>
                    <span className="project-boards-count">
                      {project.boards?.length || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* === ДОСКИ === */}
            {selectedProject && (
              <div className="section">
                <div className="section-header">
                  <div className="boards-header">
                    <h4 className="section-title">ДОСКИ</h4>
                    <span className="selected-project-name">
                      {selectedProject.title}
                    </span>
                  </div>
                  <button
                    className="create-btn"
                    onClick={handleCreateBoard}
                    title="Создать доску"
                  >
                    +
                  </button>
                </div>

                <div className="boards-list">
                  {selectedProject.boards?.map((board) => (
                    <Link
                      key={board.id}
                      to={`/${user.username}/project/${selectedProject.id}/board/${board.id}`}
                      className={`board-link ${
                        isBoardActive(board.id) ? 'active' : ''
                      }`}
                    >
                      <span className="board-icon">📋</span>
                      <span className="board-name">{board.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === ОБЩЕЕ === */}
        <div className="general-section-bottom">
          <h4 className="section-title">ОБЩЕЕ</h4>
          <div className="general-item">Дашборд</div>
          <div className="general-item">Поиск задач</div>
        </div>
      </div>

      {/* === МОДАЛКА: Создание проекта === */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3>Создать проект</h3>
            <form onSubmit={handleProjectSubmit}>
              <input
                type="text"
                placeholder="Название проекта"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowProjectModal(false)}>Отмена</button>
                <button type="submit">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === МОДАЛКА: Создание доски === */}
      {showBoardModal && (
        <div className="modal-overlay" onClick={() => setShowBoardModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3>Создать доску</h3>
            <form onSubmit={handleBoardSubmit}>
              <input
                type="text"
                placeholder="Название доски"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowBoardModal(false)}>Отмена</button>
                <button type="submit">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}