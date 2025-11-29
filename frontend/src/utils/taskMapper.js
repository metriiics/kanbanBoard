/**
 * Нормализация данных задачи для отображения на карточке доски
 */
export function normalizeTaskCard(task) {
  if (!task) return null;

  // Обрабатываем labels - убеждаемся что это массив
  let labels = [];
  if (Array.isArray(task.labels)) {
    labels = task.labels;
  } else if (task.labels) {
    labels = [task.labels];
  }

  // Обрабатываем assignee
  const assignee = task.assignee || null;

  // Обрабатываем due_date/dueDate
  const dueDate = task.due_date || task.dueDate || null;

  return {
    id: task.id,
    title: task.title || null,
    description: task.description || null,
    priority: task.priority || null,
    dueDate: dueDate,
    due_date: dueDate, // для обратной совместимости
    column_id: task.column_id || task.column?.id || null,
    board_id: task.board_id || null,
    created_at: task.created_at || null,
    labels: labels,
    assignee: assignee,
    // Дополнительные поля для совместимости
    projectName: task.projectName || null,
    columnTitle: task.columnTitle || task.column?.title || null,
  };
}

/**
 * Нормализация детальных данных задачи
 */
export function normalizeTaskDetail(detail) {
  if (!detail) return null;

  return {
    id: detail.id,
    title: detail.title || null,
    description: detail.description || null,
    priority: detail.priority || null,
    dueDate: detail.due_date || detail.dueDate || null,
    due_date: detail.due_date || detail.dueDate || null,
    createdAt: detail.created_at || detail.createdAt || null,
    created_at: detail.created_at || detail.createdAt || null,
    common_id: detail.common_id || null,
    column: detail.column || null,
    labels: Array.isArray(detail.labels) ? detail.labels : [],
    assignee: detail.assignee || null,
    comments: Array.isArray(detail.comments) ? detail.comments : [],
  };
}

/**
 * Получить отображаемое имя исполнителя
 */
export function getAssigneeDisplayName(assignee) {
  if (!assignee) return "";
  
  const fullName = [assignee.first_name, assignee.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  
  return fullName || assignee.username || assignee.email || "Без имени";
}

