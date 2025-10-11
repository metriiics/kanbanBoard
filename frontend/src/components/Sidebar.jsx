import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

export default function Sidebar({ isCollapsed, onToggle }) {
  const [expandedProjects, setExpandedProjects] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const location = useLocation();
  const { id } = useParams();

  // Пример данных проектов и досок
  const workspace = {
    name: 'Мое рабочее пространство',
    projects: [
      {
        id: 1,
        name: 'Разработка Kanban доски',
        boards: [
          { id: 1, name: 'Бэклог', path: '/board/1' },
          { id: 2, name: 'Активная разработка', path: '/board/2' },
          { id: 3, name: 'Тестирование', path: '/board/3' }
        ]
      },
      {
        id: 2,
        name: 'Маркетинг',
        boards: [
          { id: 4, name: 'Кампания Q1', path: '/board/4' },
          { id: 5, name: 'Контент план', path: '/board/5' }
        ]
      },
      {
        id: 3,
        name: 'Дизайн',
        boards: [
          { id: 6, name: 'UI/UX', path: '/board/6' }
        ]
      }
    ]
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleCreateProject = (e) => {
    e.stopPropagation();
    console.log('Создать новый проект');
  };

  const handleCreateBoard = (e) => {
    e.stopPropagation();
    console.log('Создать новую доску в проекте:', selectedProject?.name);
  };

  const isBoardActive = (boardPath) => {
    return location.pathname === boardPath;
  };

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
            <span title={workspace.name}>🏢</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="workspace-info">
          <h3>{workspace.name}</h3>
        </div>
        <button className="toggle-btn" onClick={onToggle}>
          ◀
        </button>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-sections">
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
            
            {workspace.projects.map(project => (
              <div key={project.id} className="project-item">
                <div 
                  className={`project-header ${selectedProject?.id === project.id ? 'selected' : ''}`}
                  onClick={() => handleProjectClick(project)}
                >
                  <span className="project-icon">📁</span>
                  <span className="project-name">{project.name}</span>
                  <span className="project-boards-count">({project.boards.length})</span>
                </div>
              </div>
            ))}
          </div>

          {selectedProject && (
            <div className="section">
              <div className="section-header">
                <div className="boards-header">
                  <h4 className="section-title">ДОСКИ</h4>
                  <span className="selected-project-name">{selectedProject.name}</span>
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
                {selectedProject.boards.map(board => (
                  <Link
                    key={board.id}
                    to={board.path}
                    className={`board-link ${isBoardActive(board.path) ? 'active' : ''}`}
                  >
                    <span className="board-icon">📋</span>
                    <span className="board-name">{board.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="general-section-bottom">
        <h4 className="section-title">ОБЩЕЕ</h4>
        <div className="general-item">Дашборд</div>
        <div className="general-item">Поиск задач</div>
      </div>
    </div>
  );
}