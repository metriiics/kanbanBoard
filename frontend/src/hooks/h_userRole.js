import { useMemo } from 'react';
import { useWorkspace } from './h_workspace';

/**
 * Хук для получения роли текущего пользователя в workspace
 * @returns {object} { role: string, canCreateTasks: boolean, canComment: boolean, canEdit: boolean, isOwner: boolean }
 */
export function useUserRole() {
  const { workspace } = useWorkspace();
  
  const roleInfo = useMemo(() => {
    const role = workspace?.role?.toLowerCase() || '';
    
    return {
      role,
      // Владелец имеет все права
      isOwner: role === 'owner',
      // Участник и владелец могут создавать/редактировать задачи
      canCreateTasks: role === 'participant' || role === 'owner',
      canEditTasks: role === 'participant' || role === 'owner',
      // Комментатор, участник и владелец могут комментировать
      canComment: role === 'commenter' || role === 'participant' || role === 'owner',
      // Только владелец может создавать/редактировать проекты, доски, колонки
      canManageProjects: role === 'owner',
      canManageBoards: role === 'owner',
      canManageColumns: role === 'owner',
      // Читатель может только просматривать
      isReader: role === 'reader',
      isCommenter: role === 'commenter',
      isParticipant: role === 'participant',
    };
  }, [workspace?.role]);
  
  return roleInfo;
}

