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

  // Обрабатываем assignee и assignees
  const assignee = task.assignee || null;
  // Поддержка как нового формата (assignees), так и старого (assignee)
  // Нормализуем assignees, чтобы гарантировать наличие всех полей
  let assignees = [];
  if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
    // Нормализуем каждый элемент массива, чтобы гарантировать наличие всех полей
    assignees = task.assignees.map(a => {
      // Сохраняем все поля, включая avatar_url (проверяем оба варианта написания)
      const normalized = {
        id: a.id,
        first_name: a.first_name || null,
        last_name: a.last_name || null,
        username: a.username || null,
        email: a.email || null,
        avatar_url: a.avatar_url || a.avatarUrl || null, // Проверяем оба варианта
      };
      
      return normalized;
    });
  } else if (task.assignee && typeof task.assignee === 'object') {
    // Нормализуем одиночного assignee
    assignees = [{
      id: task.assignee.id,
      first_name: task.assignee.first_name || null,
      last_name: task.assignee.last_name || null,
      username: task.assignee.username || null,
      email: task.assignee.email || null,
      avatar_url: task.assignee.avatar_url || task.assignee.avatarUrl || null, // Проверяем оба варианта
    }];
  }

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
    assignee: assignee,  // Оставляем для обратной совместимости
    assignees: assignees,  // Новое поле для множественных исполнителей
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

  // Поддержка как нового формата (assignees), так и старого (assignee)
  // Нормализуем assignees, чтобы гарантировать наличие всех полей
  let assignees = [];
  if (detail.assignees && Array.isArray(detail.assignees) && detail.assignees.length > 0) {
    // Нормализуем каждый элемент массива, чтобы гарантировать наличие всех полей
    assignees = detail.assignees.map(a => ({
      id: a.id,
      first_name: a.first_name || null,
      last_name: a.last_name || null,
      username: a.username || null,
      email: a.email || null,
      avatar_url: a.avatar_url || a.avatarUrl || null, // Проверяем оба варианта
    }));
  } else if (detail.assignee && typeof detail.assignee === 'object') {
    // Нормализуем одиночного assignee
    assignees = [{
      id: detail.assignee.id,
      first_name: detail.assignee.first_name || null,
      last_name: detail.assignee.last_name || null,
      username: detail.assignee.username || null,
      email: detail.assignee.email || null,
      avatar_url: detail.assignee.avatar_url || detail.assignee.avatarUrl || null, // Проверяем оба варианта
    }];
  }

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
    column_id: detail.column_id || detail.column?.id || null, // Добавляем column_id для совместимости с normalizeTaskCard
    board_id: detail.board_id || detail.column?.board_id || detail.column?.board?.id || null, // Добавляем board_id
    labels: Array.isArray(detail.labels) ? detail.labels : [],
    assignee: detail.assignee || null, // Оставляем для обратной совместимости
    assignees: assignees, // Новое поле для множественных исполнителей
    author: detail.author || null,
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

