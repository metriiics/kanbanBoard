import { useState, useEffect } from 'react';
import { getAvailableColors } from '../api/a_colors';

export const useColors = () => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchColors = async () => {
    setLoading(true);
    setError(null);
    try {
      const colorsData = await getAvailableColors();
      setColors(colorsData);
    } catch (err) {
      console.error('Ошибка загрузки цветов:', err);
      setError(err);
      // Просто оставляем пустой массив вместо fallback
      setColors([]);
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
  };
};