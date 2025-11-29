import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '../../hooks/h_workspace';
import { useCurrentUser } from '../../hooks/h_useCurrentUser';
import { createInviteLink, deleteInviteLink, getActiveInvite } from '../../api/a_invites';
import { getWorkspaceMembers, removeWorkspaceMember } from '../../api/a_members';

export default function MembersSettings() {
  const { workspace, loading: workspaceLoading } = useWorkspace();
  const { user } = useCurrentUser();
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState('');
  const [memberAction, setMemberAction] = useState({ state: 'idle', message: '', targetId: null });
  const [search, setSearch] = useState('');
  const [activeInvite, setActiveInvite] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState({ state: 'idle', message: '' });

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

  const handleRemoveMember = async (member) => {
    if (!workspace?.id) return;
    if (!window.confirm(`Исключить пользователя ${getDisplayName(member)}?`)) {
      return;
    }
    try {
      setMemberAction({ state: 'loading', message: '', targetId: member.user_id });
      await removeWorkspaceMember({ workspaceId: workspace.id, userId: member.user_id });
      setMembers((prev) => prev.filter((item) => item.user_id !== member.user_id));
      setMemberAction({
        state: 'success',
        message: `Пользователь ${getDisplayName(member)} исключён`,
        targetId: null,
      });
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
            return (
              <div key={member.workspace_link_id} className="member-row">
                <div className="member-info-row">
                  <div className="member-avatar">{getInitials(member)}</div>
                  <div className="member-text">
                    <div className="member-name-row">
                      <span className="member-name">{getDisplayName(member)}</span>
                      <span className="role-chip">{member.role || 'member'}</span>
                    </div>
                    <div className="member-username">
                      {member.email || member.username || '—'}
                    </div>
                  </div>
                </div>

                <div className="member-actions">
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveMember(member)}
                    disabled={removeDisabled}
                    title={
                      member.user_id === user?.id
                        ? 'Нельзя удалить себя'
                        : undefined
                    }
                  >
                    {memberAction.state === 'loading' &&
                    memberAction.targetId === member.user_id
                      ? 'Удаляем...'
                      : 'Исключить'}
                  </button>
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
    </div>
  );
}
