import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspace, useProjects } from '../../hooks/h_workspace';
import { useCurrentUser } from '../../hooks/h_useCurrentUser';
import { createInviteLink, deleteInviteLink, getActiveInvite } from '../../api/a_invites';
import { getWorkspaceMembers, removeWorkspaceMember, updateMemberRole, updateMemberProjects } from '../../api/a_members';

export default function MembersSettings() {
  const { workspace, loading: workspaceLoading } = useWorkspace();
  const { projects } = useProjects();
  const { user } = useCurrentUser();
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState('');
  const [memberAction, setMemberAction] = useState({ state: 'idle', message: '', targetId: null });
  const [search, setSearch] = useState('');
  const [activeInvite, setActiveInvite] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState({ state: 'idle', message: '' });
  
  // Состояния для редактирования участника
  const [editingMember, setEditingMember] = useState(null);
  const [editingRole, setEditingRole] = useState('');
  const [editingProjects, setEditingProjects] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const memberRowRefs = useRef({});
  
  // Состояния для portal выбора проектов
  const [projectsPortalOpen, setProjectsPortalOpen] = useState(false);
  const [projectsPortalMember, setProjectsPortalMember] = useState(null);
  const [projectsPortalRef, setProjectsPortalRef] = useState(null);
  const [projectsPortalSelected, setProjectsPortalSelected] = useState([]);
  const projectsPortalContainerRef = useRef(null);
  
  // Состояния для модального окна исключения участника
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchMembers() {
      if (!workspace?.id) return;
      try {
        setMembersLoading(true);
        setMembersError('');
        const data = await getWorkspaceMembers(workspace.id);
        if (isMounted) {
          setMembers(data);
        }
      } catch (err) {
        if (isMounted) {
          setMembersError(err?.response?.data?.detail || 'Не удалось загрузить участников');
        }
      } finally {
        if (isMounted) {
          setMembersLoading(false);
        }
      }
    }

    fetchMembers();
    return () => {
      isMounted = false;
    };
  }, [workspace?.id]);

  useEffect(() => {
    let isMounted = true;

    async function fetchActiveInvite() {
      if (!workspace?.id) return;
      try {
        const data = await getActiveInvite(workspace.id);
        if (isMounted) {
          setActiveInvite(data);
        }
      } catch (err) {
        if (err?.response?.status !== 404 && isMounted) {
          setInviteStatus({
            state: 'error',
            message: err?.response?.data?.detail || 'Не удалось получить ссылку',
          });
        }
      }
    }

    fetchActiveInvite();
    return () => {
      isMounted = false;
    };
  }, [workspace?.id]);

  const copyToClipboard = async (value) => {
    if (!value) return false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleInvitePrimaryAction = async () => {
    if (!workspace?.id) {
      setInviteStatus({
        state: 'error',
        message: 'Рабочее пространство не найдено',
      });
      return;
    }

    if (!activeInvite) {
      try {
        setInviteLoading(true);
        const data = await createInviteLink(workspace.id);
        setActiveInvite(data);
        await copyToClipboard(data.invite_url);
        setInviteStatus({
          state: 'success',
          message: 'Ссылка создана и скопирована в буфер обмена',
        });
      } catch (err) {
        setInviteStatus({
          state: 'error',
          message: err?.response?.data?.detail || 'Не удалось создать ссылку',
        });
      } finally {
        setInviteLoading(false);
      }
      return;
    }

    const copied = await copyToClipboard(activeInvite.invite_url);
    setInviteStatus({
      state: copied ? 'success' : 'error',
      message: copied ? 'Ссылка скопирована' : 'Не удалось скопировать ссылку',
    });
  };

  const handleDisableInviteLink = async () => {
    if (!activeInvite?.token) {
      setInviteStatus({
        state: 'error',
        message: 'Ссылка ещё не создана',
      });
      return;
    }
    try {
      setInviteLoading(true);
      await deleteInviteLink(activeInvite.token);
      setActiveInvite(null);
      setInviteStatus({
        state: 'success',
        message: 'Ссылка отключена',
      });
    } catch (err) {
      setInviteStatus({
        state: 'error',
        message: err?.response?.data?.detail || 'Не удалось отключить ссылку',
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    return members.filter((member) => {
      const name = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
      const username = (member.username || '').toLowerCase();
      const email = (member.email || '').toLowerCase();
      const query = search.toLowerCase();
      return name.includes(query) || username.includes(query) || email.includes(query);
    });
  }, [members, search]);

  const getDisplayName = (member) => {
    const name = `${member.first_name || ''} ${member.last_name || ''}`.trim();
    if (name) return name;
    if (member.username) return member.username;
    if (member.email) return member.email;
    return 'Без имени';
  };

  const getInitials = (member) => {
    const name = getDisplayName(member);
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleOpenRemoveModal = (member) => {
    setMemberToRemove(member);
    setRemoveModalOpen(true);
  };

  const handleCloseRemoveModal = () => {
    setRemoveModalOpen(false);
    setMemberToRemove(null);
  };

  const handleRemoveMember = async () => {
    if (!workspace?.id || !memberToRemove) return;
    
    try {
      setMemberAction({ state: 'loading', message: '', targetId: memberToRemove.user_id });
      await removeWorkspaceMember({ workspaceId: workspace.id, userId: memberToRemove.user_id });
      setMembers((prev) => prev.filter((item) => item.user_id !== memberToRemove.user_id));
      setMemberAction({
        state: 'success',
        message: `Пользователь ${getDisplayName(memberToRemove)} исключён`,
        targetId: null,
      });
      handleCloseRemoveModal();
    } catch (err) {
      setMemberAction({
        state: 'error',
        message: err?.response?.data?.detail || 'Не удалось исключить пользователя',
        targetId: null,
      });
    }
  };

  const canRemoveMember = (member) => {
    if (!user) return false;
    if (member.user_id === user.id) return false;
    return true;
  };

  const canEditMember = (member) => {
    if (!user) return false;
    if (member.user_id === user.id) return false;
    // Проверяем, что текущий пользователь может управлять участниками
    // Это должно проверяться на бэкенде, но для UI можно проверить роль
    return true;
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      reader: 'Читатель',
      commenter: 'Комментатор',
      participant: 'Участник',
      owner: 'Владелец',
      member: 'Участник', // для обратной совместимости
    };
    return roleMap[role?.toLowerCase()] || role || 'Участник';
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setEditingRole(member.role || 'participant');
    setEditingProjects(member.accessible_project_ids || []);
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditingRole('');
    setEditingProjects([]);
  };

  const handleSaveMember = async () => {
    if (!editingMember || !workspace?.id) return;
    
    setIsSaving(true);
    try {
      // Обновляем роль
      if (editingRole !== editingMember.role) {
        await updateMemberRole({
          workspaceId: workspace.id,
          userId: editingMember.user_id,
          role: editingRole,
        });
      }
      
      // Обновляем проекты
      const currentProjectIds = editingMember.accessible_project_ids || [];
      const projectIdsChanged = JSON.stringify(currentProjectIds.sort()) !== JSON.stringify(editingProjects.sort());
      if (projectIdsChanged) {
        await updateMemberProjects({
          workspaceId: workspace.id,
          userId: editingMember.user_id,
          projectIds: editingProjects,
        });
      }
      
      // Обновляем локальное состояние
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === editingMember.user_id
            ? {
                ...m,
                role: editingRole,
                accessible_project_ids: editingProjects,
              }
            : m
        )
      );
      
      setMemberAction({
        state: 'success',
        message: `Настройки участника ${getDisplayName(editingMember)} обновлены`,
        targetId: null,
      });
      
      handleCancelEdit();
    } catch (err) {
      setMemberAction({
        state: 'error',
        message: err?.response?.data?.detail || 'Не удалось обновить настройки участника',
        targetId: null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProject = (projectId) => {
    setEditingProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleOpenProjectsPortal = (member, event) => {
    event?.stopPropagation();
    setProjectsPortalMember(member);
    setProjectsPortalSelected(member.accessible_project_ids || []);
    setProjectsPortalRef(event?.currentTarget || null);
    setProjectsPortalOpen(true);
  };

  const handleCloseProjectsPortal = () => {
    setProjectsPortalOpen(false);
    setProjectsPortalMember(null);
    setProjectsPortalRef(null);
    setProjectsPortalSelected([]);
  };

  const handleToggleProjectInPortal = (projectId) => {
    setProjectsPortalSelected((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSaveProjectsFromPortal = () => {
    if (!projectsPortalMember || !workspace?.id) return;
    
    handleSaveMemberProjects(projectsPortalMember, projectsPortalSelected);
    handleCloseProjectsPortal();
  };

  const handleSaveMemberProjects = async (member, projectIds) => {
    if (!workspace?.id) return;
    
    setIsSaving(true);
    try {
      await updateMemberProjects({
        workspaceId: workspace.id,
        userId: member.user_id,
        projectIds: projectIds,
      });
      
      // Обновляем локальное состояние
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === member.user_id
            ? {
                ...m,
                accessible_project_ids: projectIds,
              }
            : m
        )
      );
      
      setMemberAction({
        state: 'success',
        message: `Проекты участника ${getDisplayName(member)} обновлены`,
        targetId: null,
      });
    } catch (err) {
      setMemberAction({
        state: 'error',
        message: err?.response?.data?.detail || 'Не удалось обновить проекты',
        targetId: null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Закрытие portal при клике вне его
  useEffect(() => {
    if (!projectsPortalOpen) return;

    const handleClickOutside = (event) => {
      if (
        projectsPortalContainerRef.current &&
        !projectsPortalContainerRef.current.contains(event.target) &&
        projectsPortalRef &&
        !projectsPortalRef.contains(event.target)
      ) {
        handleCloseProjectsPortal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [projectsPortalOpen, projectsPortalRef]);

  return (
    <div className="members-settings">
      <h3 className="members-title">
        Участники рабочего пространства ({members.length})
      </h3>

      <p className="members-description">
        Управляйте командой, отправляйте приглашения и контролируйте доступ.
      </p>

      <div className="invite-section">
        <h4 className="invite-title">Приглашайте пользователей</h4>
        <p className="invite-description">
          {workspace?.name
            ? `Поделитесь ссылкой, чтобы пригласить людей в «${workspace.name}».`
            : 'Чтобы присоединиться к рабочему пространству, нужна только пригласительная ссылка.'}
        </p>
        {activeInvite && (
          <div className="invite-link-preview" title={activeInvite.invite_url}>
            {activeInvite.invite_url}
          </div>
        )}
        <div className="invite-actions">
          <button
            className="invite-button"
            onClick={handleInvitePrimaryAction}
            disabled={inviteLoading || workspaceLoading}
          >
            {activeInvite ? 'Скопировать ссылку' : 'Создать ссылку'}
          </button>
          <button
            className="regenerate-button"
            onClick={handleDisableInviteLink}
            disabled={!activeInvite || inviteLoading}
          >
            Отключить ссылку
          </button>
        </div>
        {inviteStatus.message && (
          <div className={`invite-status ${inviteStatus.state}`}>
            {inviteStatus.message}
          </div>
        )}
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
          <span>Роль</span>
          <span>Проекты</span>
          <span>Действия</span>
        </div>

        {membersLoading && (
          <div className="members-status">Загружаем участников...</div>
        )}

        {membersError && (
          <div className="members-status error">{membersError}</div>
        )}

        {!membersLoading &&
          !membersError &&
          filteredMembers.map((member) => {
            const removeDisabled =
              !canRemoveMember(member) ||
              (memberAction.state === 'loading' &&
                memberAction.targetId === member.user_id);
            const isEditing = editingMember?.user_id === member.user_id;
            const accessibleProjects = member.accessible_project_ids || [];
            const accessibleProjectsCount = accessibleProjects.length;
            
            return (
              <div key={member.workspace_link_id} className="member-row" ref={(el) => {
                if (el) memberRowRefs.current[member.user_id] = el;
              }}>
                <div className="member-info-row">
                  <div className="member-avatar">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={`${getDisplayName(member)} avatar`}
                        className="member-avatar-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const initialsEl = e.target.parentElement.querySelector('.member-avatar-initials');
                          if (initialsEl) {
                            initialsEl.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <span 
                      className="member-avatar-initials" 
                      style={{ display: member.avatar_url ? 'none' : 'flex' }}
                    >
                      {getInitials(member)}
                    </span>
                  </div>
                  <div className="member-text">
                    <div className="member-name-row">
                      <span className="member-name">{getDisplayName(member)}</span>
                    </div>
                    <div className="member-username">
                      {member.email || member.username || '—'}
                    </div>
                  </div>
                </div>

                <div className="member-role-cell">
                  {isEditing ? (
                    <select
                      className="role-select"
                      value={editingRole}
                      onChange={(e) => setEditingRole(e.target.value)}
                      disabled={member.role?.toLowerCase() === 'owner'}
                    >
                      <option value="reader">Читатель</option>
                      <option value="commenter">Комментатор</option>
                      <option value="participant">Участник</option>
                      {member.role?.toLowerCase() === 'owner' && (
                        <option value="owner">Владелец</option>
                      )}
                    </select>
                  ) : (
                    <span className="role-chip">{getRoleDisplayName(member.role)}</span>
                  )}
                </div>

                <div className="member-projects-cell">
                  {member.role?.toLowerCase() === 'owner' ? (
                    <span className="projects-owner-badge">Все проекты</span>
                  ) : (
                    <button
                      className="projects-select-button"
                      onClick={(e) => handleOpenProjectsPortal(member, e)}
                      disabled={isEditing}
                    >
                      {accessibleProjectsCount === 0
                        ? 'Выбрать проекты'
                        : `${accessibleProjectsCount} ${accessibleProjectsCount === 1 ? 'проект' : 'проектов'}`}
                    </button>
                  )}
                </div>

                <div className="member-actions">
                  {isEditing ? (
                    <>
                      <button
                        className="save-button"
                        onClick={handleSaveMember}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button
                        className="cancel-button"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      {canEditMember(member) && (
                        <button
                          className="edit-button"
                          onClick={() => handleEditMember(member)}
                        >
                          Редактировать
                        </button>
                      )}
                      <button
                        className="remove-button"
                        onClick={() => handleOpenRemoveModal(member)}
                        disabled={removeDisabled}
                        title={
                          member.user_id === user?.id
                            ? 'Нельзя удалить себя'
                            : undefined
                        }
                      >
                        Исключить
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

        {!membersLoading && !membersError && filteredMembers.length === 0 && (
          <div className="members-empty">
            {members.length === 0
              ? 'Пока нет участников. Отправьте ссылку-приглашение.'
              : 'Пользователи не найдены.'}
          </div>
        )}
      </div>

      {memberAction.message && memberAction.state !== 'loading' && (
        <div className={`members-alert ${memberAction.state}`}>
          {memberAction.message}
        </div>
      )}

      {/* Модальное окно для исключения участника */}
      {removeModalOpen && memberToRemove && createPortal(
        <div
          className="remove-member-modal-overlay"
          onClick={handleCloseRemoveModal}
        >
          <div
            className="remove-member-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="remove-member-modal-header">
              <h3 className="remove-member-modal-title">Исключить участника</h3>
              <button
                className="remove-member-modal-close"
                onClick={handleCloseRemoveModal}
              >
                ×
              </button>
            </div>
            
            <div className="remove-member-modal-content">
              <p className="remove-member-modal-text">
                Вы уверены, что хотите исключить <strong>{getDisplayName(memberToRemove)}</strong> из рабочего пространства?
              </p>
              {memberToRemove.email && (
                <p className="remove-member-modal-email">
                  {memberToRemove.email}
                </p>
              )}
              <p className="remove-member-modal-warning">
                Это действие нельзя отменить. Участник потеряет доступ ко всем проектам и доскам этого рабочего пространства.
              </p>
            </div>
            
            <div className="remove-member-modal-footer">
              <button
                className="remove-member-modal-cancel"
                onClick={handleCloseRemoveModal}
                disabled={memberAction.state === 'loading' && memberAction.targetId === memberToRemove.user_id}
              >
                Отмена
              </button>
              <button
                className="remove-member-modal-confirm"
                onClick={handleRemoveMember}
                disabled={memberAction.state === 'loading' && memberAction.targetId === memberToRemove.user_id}
              >
                {memberAction.state === 'loading' && memberAction.targetId === memberToRemove.user_id
                  ? 'Исключаем...'
                  : 'Исключить'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Portal для выбора проектов */}
      {projectsPortalOpen && projectsPortalMember && projectsPortalRef && createPortal(
        <div
          className="projects-portal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseProjectsPortal();
            }
          }}
        >
          <div
            ref={projectsPortalContainerRef}
            className="projects-portal"
            style={(() => {
              if (!projectsPortalRef) return {};
              const rect = projectsPortalRef.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              const viewportWidth = window.innerWidth;
              
              // Вычисляем реальную высоту portal (с учетом контента)
              const estimatedPortalHeight = Math.min(400, Math.max(200, projects.length * 40 + 140));
              const portalWidth = 320;
              const padding = 8; // минимальный отступ от краев
              
              let top, left;
              
              // === Позиционирование по вертикали ===
              const spaceBelow = viewportHeight - rect.bottom;
              const spaceAbove = rect.top;
              
              if (spaceBelow >= estimatedPortalHeight + padding) {
                // Помещается снизу
                top = `${rect.bottom + padding}px`;
              } else if (spaceAbove >= estimatedPortalHeight + padding) {
                // Помещается сверху
                top = `${rect.top - estimatedPortalHeight - padding}px`;
              } else {
                // Не помещается ни сверху, ни снизу - выбираем сторону с большим пространством
                if (spaceBelow > spaceAbove) {
                  // Больше места снизу - прижимаем к низу экрана, но не меньше padding
                  const calculatedTop = viewportHeight - estimatedPortalHeight - padding;
                  top = `${Math.max(padding, calculatedTop)}px`;
                } else {
                  // Больше места сверху - прижимаем к верху экрана
                  top = `${padding}px`;
                }
              }
              
              // Дополнительная проверка: если portal все еще выходит за верхнюю границу
              const topValue = parseFloat(top);
              if (topValue < padding) {
                top = `${padding}px`;
              }
              
              // === Позиционирование по горизонтали ===
              if (rect.left + portalWidth + padding > viewportWidth) {
                // Не помещается справа - сдвигаем влево
                if (rect.right - portalWidth - padding < padding) {
                  // Не помещается даже если прижать к левому краю кнопки - прижимаем к левому краю экрана
                  left = `${padding}px`;
                } else {
                  // Выравниваем по правому краю кнопки
                  left = `${rect.right - portalWidth}px`;
                }
              } else if (rect.left - padding < 0) {
                // Кнопка слишком близко к левому краю - прижимаем portal к левому краю
                left = `${padding}px`;
              } else {
                // Помещается - выравниваем по левому краю кнопки
                left = `${rect.left}px`;
              }
              
              // Дополнительная проверка: если portal все еще выходит за границы
              const leftValue = parseFloat(left);
              if (leftValue < padding) {
                left = `${padding}px`;
              } else if (leftValue + portalWidth > viewportWidth - padding) {
                left = `${viewportWidth - portalWidth - padding}px`;
              }
              
              // Ограничиваем максимальную высоту, чтобы не выходило за границы
              const maxAvailableHeight = viewportHeight - padding * 2;
              const finalMaxHeight = Math.min(400, maxAvailableHeight);
              
              return {
                position: 'fixed',
                top,
                left,
                width: `${portalWidth}px`,
                maxHeight: `${finalMaxHeight}px`,
              };
            })()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="projects-portal-header">
              <h4 className="projects-portal-title">
                Выбор проектов для {getDisplayName(projectsPortalMember)}
              </h4>
              <button
                className="projects-portal-close"
                onClick={handleCloseProjectsPortal}
              >
                ×
              </button>
            </div>
            
            <div className="projects-portal-content">
              {projects.length === 0 ? (
                <div className="projects-portal-empty">
                  Нет проектов в рабочем пространстве
                </div>
              ) : (
                <div className="projects-portal-list">
                  {projects.map((project) => (
                    <label
                      key={project.id}
                      className="project-portal-checkbox-label"
                    >
                      <input
                        type="checkbox"
                        checked={projectsPortalSelected.includes(project.id)}
                        onChange={() => handleToggleProjectInPortal(project.id)}
                      />
                      <span className="project-portal-name">{project.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="projects-portal-footer">
              <button
                className="projects-portal-cancel"
                onClick={handleCloseProjectsPortal}
                disabled={isSaving}
              >
                Отмена
              </button>
              <button
                className="projects-portal-save"
                onClick={handleSaveProjectsFromPortal}
                disabled={isSaving}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
