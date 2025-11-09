import { useState, useEffect, useCallback } from 'react';
import { useTasks } from './h_useTasks';
import { getBoardColumns } from '../api/a_board';
import { updateColumnsPositions, updateColumnTitle } from '../api/a_columns';

export default function useBoard(boardId) {
  const [columns, setColumns] = useState([]);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { createTask } = useTasks();

  const fetchBoardData = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBoardColumns(boardId);
      setColumns(data.columns || []);
      setProjectData({
        name: data.project?.title || 'Без названия проекта',
        boardName: data.board_title || 'Без названия доски',
      });
    } catch (err) {
      console.error('Ошибка загрузки доски:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // === Сохранение позиций колонок ===
  const saveColumnPositions = useCallback(async (updatedColumns) => {
    try {
      const payload = updatedColumns.map((col, idx) => ({
        id: col.id,
        position: idx,
      }));
      await updateColumnsPositions(payload);
    } catch (err) {
      console.error('Ошибка сохранения позиций колонок:', err);
    }
  }, []);

  // === ДОБАВЛЕНИЕ ЗАДАЧИ ===
  const onAddTask = useCallback(
    async (columnId, taskData) => {
      try {
        const title = taskData?.title?.trim();
        if (!title) return;

        // 🟣 Создаём задачу на сервере
        const newTask = await createTask(title, columnId);

        // 🟢 Обновляем локально
        setColumns((prev) =>
          prev.map((col) =>
            col.id === columnId
              ? { ...col, tasks: [...col.tasks, newTask] }
              : col
          )
        );
      } catch (err) {
        console.error("Ошибка при создании задачи:", err);
      }
    },
    [createTask]
  );

  // === 🆕 Сохранение названия колонки ===
  const saveColumnTitle = useCallback(async (columnId, newTitle) => {
    try {
      // 1️⃣ Локально обновляем состояние
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, title: newTitle } : col
        )
      );

      // 2️⃣ Отправляем PUT-запрос в API
      await updateColumnTitle(columnId, newTitle);
    } catch (err) {
      console.error('Ошибка сохранения названия колонки:', err);
      setError(err);
      throw err;
    }
  }, []);

  return {
    columns,
    setColumns,
    projectData,
    loading,
    error,
    refetch: fetchBoardData,
    saveColumnPositions,
    saveColumnTitle, 
    onAddTask,
  };
}
