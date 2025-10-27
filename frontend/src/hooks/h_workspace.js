import { useEffect, useState } from 'react';
import { getProjectsByWorkspace } from '../api/workspaces';

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
