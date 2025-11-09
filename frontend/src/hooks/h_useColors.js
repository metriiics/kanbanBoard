import { useState, useEffect } from 'react';
import { getAvailableColors, updateColumnColor } from '../api/a_colors';

export const useColors = () => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /** Загрузка доступных цветов */
  const fetchColors = async () => {
    setLoading(true);
    setError(null);
    try {
      const colorsData = await getAvailableColors();
      setColors(colorsData);
    } catch (err) {
      console.error('Ошибка загрузки цветов:', err);
      setError(err);
      setColors([]);
    } finally {
      setLoading(false);
    }
  };

  /** Обновление цвета колонки на сервере */
  const saveColumnColor = async (columnId, colorId) => {
    try {
      setLoading(true);
      const updatedColumn = await updateColumnColor(columnId, colorId);
      return updatedColumn; // возвращаем ответ от API (для синхронизации состояния)
    } catch (err) {
      console.error('Ошибка при сохранении цвета колонки:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  return {
    colors,
    loading,
    error,
    refetch: fetchColors,
    saveColumnColor,
  };
};