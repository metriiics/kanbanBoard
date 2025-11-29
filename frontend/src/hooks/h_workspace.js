import { useContext, useEffect, useState } from 'react';
import { getProjectsByWorkspace } from '../api/a_workspaces';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, updateProjectTitle } from "../api/a_projects";
import { createBoard, updateBoardTitle } from "../api/a_board";
import { WorkspaceContext } from '../contexts/WorkspaceContext';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activeWorkspaceId, workspace } = useContext(WorkspaceContext) || {};

  useEffect(() => {
    const targetWorkspaceId = activeWorkspaceId || workspace?.id;
    if (!targetWorkspaceId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjectsByWorkspace(targetWorkspaceId);
        if (isMounted) {
          setProjects(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Ошибка при загрузке проектов:', err);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProjects();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, workspace?.id]);

  return { projects, setProjects, loading, error };
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      // После создания проекта обновляем список
      queryClient.invalidateQueries(["projects"]);
    },
  });
};

export const useCreateBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
    },
  });
};

export const useUpdateBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, title }) => updateBoardTitle(boardId, title),
    onSuccess: () => {
      // автоматически обновляем список проектов и досок
      queryClient.invalidateQueries(["projects"]);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, title }) => updateProjectTitle(projectId, title),
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
    },
  });
};