import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function MembersSettings() {
  const [projects] = useState([
    {
      id: 1,
      name: 'Проект Alpha',
      boards: [
        { id: 101, name: 'Задачи' },
        { id: 102, name: 'UI/UX' },
      ],
    },
    {
      id: 2,
      name: 'Маркетинг',
      boards: [
        { id: 201, name: 'Контент' },
        { id: 202, name: 'Кампании' },
      ],
    },
    {
      id: 3,
      name: 'Frontend Разработка',
      boards: [
        { id: 301, name: 'Компоненты' },
        { id: 302, name: 'Баги' },
      ],
    },
  ]);

  const [members, setMembers] = useState([
    {
      id: 1,
      name: 'Алексей Кочетков',
      username: '@metriics',
      projects: [
        { id: 1, accessAll: false, boards: [101] },
        { id: 2, accessAll: true, boards: [] },
      ],
    },
    {
      id: 2,
      name: 'Снежана Корженко',
      username: '@snezhana',
      projects: [{ id: 3, accessAll: false, boards: [301] }],
    },
  ]);

  const [search, setSearch] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  // === Логика переключения доступа ===
  const toggleProjectAccess = (memberId, projectId) => {
    setMembers(prev =>
      prev.map(member => {
        if (member.id !== memberId) return member;
        const existing = member.projects.find(p => p.id === projectId);
        if (existing) {
          return {
            ...member,
            projects: member.projects.map(p =>
              p.id === projectId ? { ...p, accessAll: !p.accessAll } : p
            ),
          };
        } else {
          return {
            ...member,
            projects: [...member.projects, { id: projectId, accessAll: true, boards: [] }],
          };
        }
      })
    );
  };

  const toggleBoardAccess = (memberId, projectId, boardId) => {
    setMembers(prev =>
      prev.map(member => {
        if (member.id !== memberId) return member;
        const project = member.projects.find(p => p.id === projectId);
        if (!project) {
          return {
            ...member,
            projects: [...member.projects, { id: projectId, accessAll: false, boards: [boardId] }],
          };
        }
        const hasBoard = project.boards.includes(boardId);
        return {
          ...member,
          projects: member.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  boards: hasBoard
                    ? p.boards.filter(id => id !== boardId)
                    : [...p.boards, boardId],
                }
              : p
          ),
        };
      })
    );
  };

  const removeMember = (id) => {
    if (window.confirm('Исключить пользователя из рабочего пространства?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleDropdownToggle = (memberId, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (openDropdown === memberId) {
      setOpenDropdown(null);
    } else {
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
      setOpenDropdown(memberId);
    }
  };

  // === Закрытие при клике вне меню ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="members-settings">
      <h3 className="members-title">
        Участники рабочего пространства ({members.length})
      </h3>

      <p className="members-description">
        Участники рабочего пространства могут просматривать проекты и доски, в зависимости от выданных разрешений.
      </p>

      <div className="invite-section">
        <h4 className="invite-title">Приглашайте пользователей</h4>
        <p className="invite-description">
          Чтобы присоединиться к этому рабочему пространству, нужна только пригласительная ссылка.
        </p>
        <div className="invite-actions">
          <button className="invite-button">Скопировать ссылку</button>
          <button className="regenerate-button">Отключить ссылку</button>
        </div>
      </div>

      <hr className="section-divider" />

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Поиск участников..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <hr className="section-divider" />

      <div className="members-table">
        <div className="members-header">
          <span>Пользователь</span>
          <span>Действия</span>
        </div>

        {filteredMembers.map((member) => (
          <div key={member.id} className="member-row">
            <div className="member-info-row">
              <div className="member-avatar">
                {member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="member-text">
                <div className="member-name">{member.name}</div>
                <div className="member-username">{member.username}</div>
              </div>
            </div>

            <div className="member-actions">
              <button
                className="dropdown-toggle"
                onClick={(e) => handleDropdownToggle(member.id, e)}
              >
                Доступ ▾
              </button>
              <button
                className="remove-button"
                onClick={() => removeMember(member.id)}
              >
                Исключить
              </button>
            </div>

            {openDropdown === member.id &&
              createPortal(
                <div
                  ref={dropdownRef}
                  className="dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    zIndex: 9999,
                  }}
                >
                  {projects.map((project) => {
                    const memberProject = member.projects.find(
                      (p) => p.id === project.id
                    );
                    const accessAll = memberProject?.accessAll || false;
                    const allowedBoards = memberProject?.boards || [];

                    return (
                      <div key={project.id} className="dropdown-project">
                        <label className="dropdown-project-title">
                          <input
                            type="checkbox"
                            checked={accessAll}
                            onChange={() =>
                              toggleProjectAccess(member.id, project.id)
                            }
                          />
                          {project.name}
                        </label>

                        <div className="dropdown-boards">
                          {project.boards.map((board) => (
                            <label key={board.id} className="dropdown-item">
                              <input
                                type="checkbox"
                                checked={
                                  accessAll ||
                                  allowedBoards.includes(board.id)
                                }
                                disabled={accessAll}
                                onChange={() =>
                                  toggleBoardAccess(
                                    member.id,
                                    project.id,
                                    board.id
                                  )
                                }
                              />
                              {board.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>,
                document.body
              )}
          </div>
        ))}

        {filteredMembers.length === 0 && (
          <div className="no-results">Пользователи не найдены</div>
        )}
      </div>
    </div>
  );
}
