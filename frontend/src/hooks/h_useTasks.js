// src/hooks/useTasks.js
import { useState } from "react";
import { createTaskApi, updateTaskApi } from "../api/a_tasks";

export const useTasks = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTask = async (title, columnId) => {
    try {
      setLoading(true);
      const newTask = await createTaskApi({ title, column_id: columnId });
      return newTask;
    } catch (err) {
      console.error("Ошибка при создании задачи:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId, data) => {
    try {
      setLoading(true);
      const updated = await updateTaskApi(taskId, data);
      return updated; // TaskDetailOut
    } catch (err) {
      console.error("Ошибка при обновлении задачи:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTask,
    updateTask,
    loading,
    error,
  };
};
