import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentWorkspace, getUserWorkspaces } from "../api/a_workspaces";

export const WorkspaceContext = createContext(null);

export default function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");

  const [workspaceList, setWorkspaceList] = useState([]);
  const [workspaceListLoading, setWorkspaceListLoading] = useState(true);
  const [workspaceListError, setWorkspaceListError] = useState("");

  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => {
    const stored = localStorage.getItem("activeWorkspaceId");
    if (!stored) {
      return null;
    }
    const numeric = Number(stored);
    return Number.isFinite(numeric) ? numeric : null;
  });

  const loadWorkspace = useCallback(
    async (targetWorkspaceId = null) => {
      try {
        setWorkspaceLoading(true);
        setWorkspaceError("");
        const data = await getCurrentWorkspace(targetWorkspaceId ?? activeWorkspaceId ?? undefined);
        setWorkspace(data);
        if (!targetWorkspaceId && !activeWorkspaceId) {
          localStorage.setItem("activeWorkspaceId", String(data.id));
          setActiveWorkspaceIdState(data.id);
        } else if ((targetWorkspaceId ?? activeWorkspaceId) !== data.id) {
          localStorage.setItem("activeWorkspaceId", String(data.id));
          setActiveWorkspaceIdState(data.id);
        }
      } catch (err) {
        setWorkspace(null);
        const status = err?.response?.status;
        if (status === 401) {
          setWorkspaceError("");
        } else {
          setWorkspaceError(err?.response?.data?.detail || "Не удалось загрузить рабочее пространство");
        }
        if (targetWorkspaceId || activeWorkspaceId) {
          localStorage.removeItem("activeWorkspaceId");
          setActiveWorkspaceIdState(null);
        }
      } finally {
        setWorkspaceLoading(false);
      }
    },
    [activeWorkspaceId]
  );

  const loadWorkspaceList = useCallback(async () => {
    try {
      setWorkspaceListLoading(true);
      setWorkspaceListError("");
      const data = await getUserWorkspaces();
      setWorkspaceList(data);
    } catch (err) {
      setWorkspaceListError(err?.response?.data?.detail || "Не удалось загрузить список пространств");
    } finally {
      setWorkspaceListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [activeWorkspaceId, loadWorkspace]);

  useEffect(() => {
    loadWorkspaceList();
  }, [loadWorkspaceList]);

  const setActiveWorkspaceId = useCallback((workspaceId) => {
    if (workspaceId) {
      localStorage.setItem("activeWorkspaceId", String(workspaceId));
      setActiveWorkspaceIdState(workspaceId);
    } else {
      localStorage.removeItem("activeWorkspaceId");
      setActiveWorkspaceIdState(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      workspace,
      workspaceLoading,
      workspaceError,
      activeWorkspaceId,
      setActiveWorkspaceId,
      refreshWorkspace: () => loadWorkspace(activeWorkspaceId),
      workspaceList,
      workspaceListLoading,
      workspaceListError,
      refreshWorkspaceList: loadWorkspaceList,
    }),
    [
      workspace,
      workspaceLoading,
      workspaceError,
      activeWorkspaceId,
      setActiveWorkspaceId,
      loadWorkspace,
      workspaceList,
      workspaceListLoading,
      workspaceListError,
      loadWorkspaceList,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspaceContext must be used within a WorkspaceProvider");
  }
  return ctx;
}

