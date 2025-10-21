import { useEffect, useState } from 'react';
import { getProjectsByWorkspace } from '../api/workspaces';

export function useProjects(workspaceId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);

    getProjectsByWorkspace(workspaceId)
      .then((data) => setProjects(data))
      .catch((err) => {
        console.error('Ошибка при загрузке проектов:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  return { projects, loading, error };
}
