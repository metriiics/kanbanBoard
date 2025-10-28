import { useEffect, useState } from 'react';
import { getProjectsByWorkspace, getCurrentWorkspace } from '../api/a_workspaces';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "../api/a_projects";
import { createBoard } from "../api/a_board";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjectsByWorkspace();
        setProjects(data);
      } catch (err) {
        console.error('Ошибка при загрузке проектов:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const data = await getCurrentWorkspace();
        setWorkspace(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkspace();
  }, []);

  return { workspace, loading, error };
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

