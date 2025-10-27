import { useState, useEffect, useCallback } from 'react';
import { getBoardColumns } from '../api/a_board';
import { updateColumnsPositions } from '../api/a_columns';

export default function useBoard(boardId) {
  const [columns, setColumns] = useState([]);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Сохраняет позиции на сервере; принимает обновлённый массив columns
  const saveColumnPositions = useCallback(async (updatedColumns) => {
    try {
      const payload = updatedColumns.map((col, idx) => ({
        id: col.id,
        position: idx, // позиция в порядке массива
      }));
      await updateColumnsPositions(payload);
      // Не обязательно делать setColumns — предполагаем, что caller уже обновил локально
    } catch (err) {
      console.error('Ошибка сохранения позиций колонок:', err);
      // Можно сделать повторную загрузку или показать UI-ошибку
    }
  }, []);

  return {
    columns,
    setColumns,
    projectData,
    loading,
    error,
    refetch: fetchBoardData,
    saveColumnPositions, // <-- новый метод
  };
}
