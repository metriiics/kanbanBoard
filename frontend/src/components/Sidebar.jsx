import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  useProjects,
  useCreateProject,
  useWorkspace,
  useCreateBoard,
} from '../hooks/h_workspace';
import { useCurrentUser } from '../hooks/h_useCurrentUser';

export default function Sidebar({ isCollapsed, onToggle }) {
  const [expandedProjects, setExpandedProjects] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [targetItem, setTargetItem] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const [dropdownData, setDropdownData] = useState(null); // { id, x, y, type }
  const dropdownRef = useRef(null);

  const createBoard = useCreateBoard();
  const createProject = useCreateProject();
  const { workspace } = useWorkspace();
  const { projects, loading, error } = useProjects();
  const { user } = useCurrentUser();
  const location = useLocation();

  const workspaceName = user?.username || 'Загрузка...';

  const [projectTitle, setProjectTitle] = useState('');
  const [boardTitle, setBoardTitle] = useState('');

  // === Клик вне меню закрывает дропдаун ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdownData(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectClick = (project) => setSelectedProject(project);

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
    if (!workspace) return alert('Рабочее пространство не определено');
    try {
      const newProject = await createProject.mutateAsync({
        title: projectTitle,
        workspaces_id: workspace.id,
      });
      console.log('Проект создан:', newProject);
      setShowProjectModal(false);
      setProjectTitle('');
      window.location.reload();
    } catch (err) {
      console.error('Ошибка при создании проекта:', err);
      alert('Не удалось создать проект');
    }
  };

  const handleBoardSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return alert('Проект не выбран');
    try {
      const newBoard = await createBoard.mutateAsync({
        title: boardTitle,
        projects_id: selectedProject.id,
      });
      console.log('Доска создана:', newBoard);
      setShowBoardModal(false);
      setBoardTitle('');
      window.location.reload();
    } catch (err) {
      console.error('Ошибка при создании доски:', err);
      alert('Не удалось создать доску');
    }
  };

  // === Универсальные модалки ===
  const openRenameModal = (item, type) => {
    setTargetItem(item);
    setNewTitle(item.title);
    setModalType(`rename-${type}`);
    setDropdownData(null);
  };

  const openDeleteModal = (item, type) => {
    setTargetItem(item);
    setModalType(`delete-${type}`);
    setDropdownData(null);
  };

  const closeModal = () => {
    setModalType(null);
    setTargetItem(null);
    setNewTitle('');
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    console.log('Переименовать', modalType, 'в', newTitle);
    closeModal();
  };

  const handleDeleteConfirm = () => {
    console.log('Удалить', modalType, targetItem);
    closeModal();
  };

  const isBoardActive = (boardId) =>
    location.pathname.includes(`/boards/${boardId}`);

  // === Открытие дропдауна (через портал) ===
  const openDropdown = (e, id, type) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownData({
      id,
      type,
      x: rect.left,
      y: rect.bottom + 4, // чуть ниже кнопки
    });
  };

  // === Контент дропдауна ===
  const dropdownMenu =
    dropdownData &&
    createPortal(
      <div
        ref={dropdownRef}
        className="dropdown-menu"
        style={{
          position: 'absolute',
          top: dropdownData.y,
          left: dropdownData.x,
        }}
      >
        <button
          onClick={() =>
            openRenameModal(
              dropdownData.type === 'project'
                ? projects.find((p) => p.id === dropdownData.id)
                : selectedProject.boards.find((b) => b.id === dropdownData.id),
              dropdownData.type
            )
          }
        >
          Переименовать
        </button>
        <button
          onClick={() =>
            openDeleteModal(
              dropdownData.type === 'project'
                ? projects.find((p) => p.id === dropdownData.id)
                : selectedProject.boards.find((b) => b.id === dropdownData.id),
              dropdownData.type
            )
          }
        >
          Удалить
        </button>
      </div>,
      document.body
    );

  if (loading) return <div className="sidebar">Загрузка...</div>;
  if (error)
    return (
      <div className="sidebar">
        Ошибка загрузки проектов: {error.message || JSON.stringify(error)}
      </div>
    );

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

                    <div
                      className="menu-wrapper"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="menu-button"
                        onClick={(e) => openDropdown(e, project.id, 'project')}
                      >
                        ⋮
                      </button>
                    </div>
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
                    <div key={board.id} className="board-item">
                      <div
                        className={`board-link-wrapper ${
                          isBoardActive(board.id) ? 'active' : ''
                        }`}
                      >
                        <Link
                          to={`/${user.username}/project/${selectedProject.id}/board/${board.id}`}
                          className="board-link"
                        >
                          <span className="board-icon">📋</span>
                          <span className="board-name">{board.title}</span>
                        </Link>

                        <div
                          className="menu-wrapper"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="menu-button"
                            onClick={(e) => openDropdown(e, board.id, 'board')}
                          >
                            ⋮
                          </button>
                        </div>
                      </div>
                    </div>
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

      {/* === Дропдаун через Portal === */}
      {dropdownMenu}

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
                <button type="button" onClick={() => setShowProjectModal(false)}>
                  Отмена
                </button>
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
                <button type="button" onClick={() => setShowBoardModal(false)}>
                  Отмена
                </button>
                <button type="submit">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Универсальная модалка (переимен/удаление) === */}
      {modalType && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            {modalType.startsWith('rename') ? (
              <>
                <h3>
                  {modalType.includes('project')
                    ? 'Редактирование проекта'
                    : 'Редактирование доски'}
                </h3>
                <form onSubmit={handleRenameSubmit}>
                  <label>
                    Название {modalType.includes('project') ? 'проекта' : 'доски'}
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Введите новое название"
                    required
                  />
                  <div className="modal-actions">
                    <button type="button" onClick={closeModal}>
                      Отмена
                    </button>
                    <button type="submit">Сохранить</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3>
                  {modalType.includes('project')
                    ? 'Удаление проекта'
                    : 'Удаление доски'}
                </h3>
                <p>
                  Вы уверены, что хотите удалить{' '}
                  {modalType.includes('project') ? 'проект' : 'доску'}{' '}
                  <strong>"{targetItem?.title}"</strong>?
                </p>
                <div className="modal-actions">
                  <button type="button" onClick={closeModal}>
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    style={{ background: '#ef4444', color: 'white' }}
                  >
                    Удалить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
