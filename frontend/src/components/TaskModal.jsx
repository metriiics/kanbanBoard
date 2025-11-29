import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Calendar from 'react-calendar';
import { useTasks } from "../hooks/h_useTasks";
import { getTaskDetailsApi, createCommentApi } from "../api/a_tasks";
import { getWorkspaceMembers } from "../api/a_members";
import { getWorkspaceLabels, createWorkspaceLabel } from "../api/a_workspaces";
import { useWorkspaceContext } from "../contexts/WorkspaceContext";
import { normalizeTaskDetail, getAssigneeDisplayName } from "../utils/taskMapper";

const formatMemberName = (member) => {
  if (!member) return "";
  const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
  return fullName || member.username || member.email || "Без имени";
};

const mapMemberToAssignee = (member) => ({
  id: member.user_id,
  firstName: member.first_name ?? "",
  lastName: member.last_name ?? "",
  username: member.username ?? "",
  email: member.email ?? "",
  displayName: formatMemberName(member),
});

const formatCommentUser = (user) => {
  if (!user) return "Неизвестный пользователь";
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.username || user.email || "Неизвестный пользователь";
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const formatDateOnly = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
};

const cleanupPayload = (payload) => {
  const cleaned = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

export default function TaskModal({
  task,
  isOpen,
  onClose,
  isRightAligned,
  onToggleAlignment,
  onTaskUpdated,
}) {
  const taskId = task?.id;
  const { workspace, activeWorkspaceId } = useWorkspaceContext();
  const workspaceId = workspace?.id ?? activeWorkspaceId ?? null;

  const [taskDetail, setTaskDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || task?.due_date || null);
  const [priority, setPriority] = useState(task?.priority || "");
  const [assignee, setAssignee] = useState(task?.assignee || null);
  const [selectedLabels, setSelectedLabels] = useState(task?.labels || []);

  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);

  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [labelsSearch, setLabelsSearch] = useState("");

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  const [labelsOptions, setLabelsOptions] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [labelsError, setLabelsError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  const { updateTask } = useTasks();
  const [isSaving, setIsSaving] = useState(false);
  const savingCounterRef = useRef(0);

  const descriptionSaveTimer = useRef(null);
  const tagsDropdownRef = useRef(null);
  const assigneeDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);

  const hydrateFromDetail = useCallback((detail) => {
    setTitle(detail.title ?? "");
    setDescription(detail.description ?? "");
    setDueDate(detail.dueDate ?? null);
    setPriority(detail.priority ?? "");
    setAssignee(detail.assignee ?? null);
    setSelectedLabels(detail.labels ?? []);
  }, []);

  useEffect(() => {
    if (!isOpen || !task || taskDetail) return;
    setTitle(task.title ?? "");
    setDescription(task.description ?? "");
    setDueDate(task.dueDate ?? task.due_date ?? null);
    setPriority(task.priority ?? "");
    setAssignee(task.assignee ?? null);
    setSelectedLabels(task.labels ?? []);
  }, [isOpen, task, taskDetail]);

  useEffect(() => {
    if (!isOpen || !taskId) return;
    let ignore = false;
    setDetailLoading(true);
    setDetailError("");

    (async () => {
      try {
        const data = await getTaskDetailsApi(taskId);
        if (ignore) return;
        const normalized = normalizeTaskDetail(data);
        setTaskDetail(normalized);
        hydrateFromDetail(normalized);
      } catch (err) {
        if (!ignore) {
          setDetailError(err?.response?.data?.detail || "Не удалось загрузить данные задачи");
        }
      } finally {
        if (!ignore) {
          setDetailLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isOpen, taskId, hydrateFromDetail]);

  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    let ignore = false;
    setMembersLoading(true);
    setMembersError("");

    (async () => {
      try {
        const data = await getWorkspaceMembers(workspaceId);
        if (!ignore) {
          setMembers(data || []);
        }
      } catch (err) {
        if (!ignore) {
          setMembersError(err?.response?.data?.detail || "Не удалось загрузить участников");
          setMembers([]);
        }
      } finally {
        if (!ignore) {
          setMembersLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isOpen, workspaceId]);

  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    let ignore = false;
    setLabelsLoading(true);
    setLabelsError("");

    (async () => {
      try {
        const data = await getWorkspaceLabels(workspaceId);
        if (!ignore) {
          setLabelsOptions(data || []);
        }
      } catch (err) {
        if (!ignore) {
          setLabelsError(err?.response?.data?.detail || "Не удалось загрузить теги");
          setLabelsOptions([]);
        }
      } finally {
        if (!ignore) {
          setLabelsLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isOpen, workspaceId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isTagsDropdownOpen && tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
        setIsTagsDropdownOpen(false);
      }
      if (
        isAssigneeDropdownOpen &&
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
      if (
        isPriorityDropdownOpen &&
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target)
      ) {
        setIsPriorityDropdownOpen(false);
      }
      if (isDateDropdownOpen && dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isOpen,
    isTagsDropdownOpen,
    isAssigneeDropdownOpen,
    isPriorityDropdownOpen,
    isDateDropdownOpen,
  ]);

  useEffect(() => {
    if (isOpen) return;
    setIsAssigneeDropdownOpen(false);
    setIsPriorityDropdownOpen(false);
    setIsDateDropdownOpen(false);
    setIsTagsDropdownOpen(false);
    setAssigneeSearch("");
    setLabelsSearch("");
    if (descriptionSaveTimer.current) {
      clearTimeout(descriptionSaveTimer.current);
      descriptionSaveTimer.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (descriptionSaveTimer.current) {
        clearTimeout(descriptionSaveTimer.current);
      }
    };
  }, []);

  const saveTaskChanges = useCallback(
    async (patch) => {
      if (!taskId) return;
      const cleaned = cleanupPayload(patch);
      if (Object.keys(cleaned).length === 0) return;

      savingCounterRef.current += 1;
      setIsSaving(true);
      try {
        const updated = await updateTask(taskId, cleaned);
        const normalized = normalizeTaskDetail(updated);
        setTaskDetail(normalized);
        hydrateFromDetail(normalized);
        if (onTaskUpdated) {
          onTaskUpdated(normalized);
        }
      } catch (err) {
        console.error("Ошибка при сохранении задачи:", err);
      } finally {
        savingCounterRef.current -= 1;
        if (savingCounterRef.current <= 0) {
          setIsSaving(false);
        }
      }
    },
    [taskId, updateTask, hydrateFromDetail, onTaskUpdated]
  );

  const handleTitleChange = (value) => {
    setTitle(value);
    if (descriptionSaveTimer.current) {
      clearTimeout(descriptionSaveTimer.current);
    }
    descriptionSaveTimer.current = setTimeout(() => {
      saveTaskChanges({ title: value });
    }, 700);
  };

  const handleDescriptionChange = (value) => {
    setDescription(value);
    if (descriptionSaveTimer.current) {
      clearTimeout(descriptionSaveTimer.current);
    }
    descriptionSaveTimer.current = setTimeout(() => {
      saveTaskChanges({ description: value });
    }, 700);
  };

  const handleDueDateSelect = (value) => {
    const isoString = value ? new Date(value).toISOString() : null;
    setDueDate(isoString);
    setIsDateDropdownOpen(false);
    saveTaskChanges({ due_date: isoString });
  };

  const handleDueDateClear = (event) => {
    event?.stopPropagation();
    setDueDate(null);
    saveTaskChanges({ due_date: null });
  };

  const handlePrioritySelect = (level) => {
    setPriority(level);
    setIsPriorityDropdownOpen(false);
    saveTaskChanges({ priority: level });
  };

  const handlePriorityClear = (event) => {
    event?.stopPropagation();
    setPriority("");
    saveTaskChanges({ priority: null });
  };

  const handleAssigneeSelect = (member) => {
    const normalized = mapMemberToAssignee(member);
    setAssignee(normalized);
    setIsAssigneeDropdownOpen(false);
    saveTaskChanges({ assigned_to: member.user_id });
  };

  const handleAssigneeClear = (event) => {
    event?.stopPropagation();
    setAssignee(null);
    saveTaskChanges({ assigned_to: null });
  };

  const handleLabelToggle = (label) => {
    const exists = selectedLabels.some((current) => current.id === label.id);
    const updated = exists
      ? selectedLabels.filter((item) => item.id !== label.id)
      : [...selectedLabels, label];
    setSelectedLabels(updated);
    saveTaskChanges({ label_ids: updated.map((item) => item.id) });
  };

  const filteredMembers = useMemo(() => {
    const query = assigneeSearch.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => {
      const haystack = `${formatMemberName(member)} ${member.email ?? ""} ${member.username ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [assigneeSearch, members]);

  const filteredLabels = useMemo(() => {
    const query = labelsSearch.trim().toLowerCase();
    if (!query) return labelsOptions;
    return labelsOptions.filter((label) => (label.name ?? "").toLowerCase().includes(query));
  }, [labelsSearch, labelsOptions]);

  const canCreateNewLabel = useMemo(() => {
    const query = labelsSearch.trim();
    if (!query) return false;
    return !labelsOptions.some((label) => (label.name ?? "").toLowerCase() === query.toLowerCase());
  }, [labelsSearch, labelsOptions]);

  const handleCreateLabel = async () => {
    const labelName = labelsSearch.trim();
    if (!labelName || !workspaceId) return;

    setIsCreatingLabel(true);
    try {
      const newLabel = await createWorkspaceLabel(workspaceId, labelName, "#d1d5db");
      setLabelsOptions((prev) => [...prev, newLabel]);
      setLabelsSearch("");
      handleLabelToggle(newLabel);
    } catch (err) {
      console.error("Ошибка при создании тега:", err);
      setLabelsError(err?.response?.data?.detail || "Не удалось создать тег");
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const handleCreateComment = async () => {
    const content = newComment.trim();
    if (!content || !taskId) return;

    setIsCreatingComment(true);
    try {
      await createCommentApi(taskId, content);
      // Обновляем детали задачи, чтобы получить обновленный список комментариев
      const updatedDetails = await getTaskDetailsApi(taskId);
      const normalized = normalizeTaskDetail(updatedDetails);
      setTaskDetail(normalized);
      setNewComment("");
    } catch (err) {
      console.error("Ошибка при создании комментария:", err);
    } finally {
      setIsCreatingComment(false);
    }
  };

  if (!isOpen || !task) {
    return null;
  }

  const createdAt = taskDetail?.createdAt || task?.createdAt || task?.created_at || null;
  const comments = taskDetail?.comments ?? [];
  const assigneeName = getAssigneeDisplayName(assignee);

  return (
    <>
      <div className={`modal-overlay ${isRightAligned ? "right-aligned" : ""}`} onClick={onClose} />

      <div
        className={`task-modal ${isRightAligned ? "right-sidebar" : "centered"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <input
              type="text"
              className="task-title-input"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Название задачи..."
              style={{
                fontSize: "20px",
                fontWeight: "600",
                border: "none",
                outline: "none",
                background: "transparent",
                width: "100%",
                padding: "4px 0",
                color: "#172b4d",
                marginBottom: "8px",
              }}
            />

            <div className="task-meta-header">
              <span className="created-date">
                Создано: {createdAt ? formatDateOnly(createdAt) : "—"}
              </span>

              <div className="meta-separator">•</div>

              <span className="meta-project">
                Проект: <strong>{task.projectName || "Без проекта"}</strong>
              </span>

              <div className="meta-separator">•</div>

              <span className="meta-board">
                Колонка: <strong>{taskDetail?.column?.title || task.columnTitle || "Без колонки"}</strong>
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <div className={`saving-indicator ${isSaving ? "saving" : ""}`}>
              {isSaving ? "Сохраняем..." : "Все изменения сохранены"}
            </div>
            <button
              className="align-btn"
              onClick={onToggleAlignment}
              title={isRightAligned ? "Вернуть в центр" : "Сместить вправо"}
            >
              {isRightAligned ? "⤢" : "⤡"}
            </button>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="modal-content">
          {detailError && <div className="error-banner">{detailError}</div>}
          {detailLoading && !taskDetail && <div className="loading-placeholder">Загрузка данных...</div>}

          <div className="task-details">
            <div className="detail-item">
              <span className="detail-label">Исполнитель</span>
              <div className="tags-dropdown-container" ref={assigneeDropdownRef}>
                <div
                  className="tags-main-row"
                  onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
                >
                  <div className="tags-list">
                    {assignee ? (
                      <span className="tag-item assignee-tag">
                        {assigneeName}
                        <button className="tag-remove" onClick={handleAssigneeClear}>
                          ×
                        </button>
                      </span>
                    ) : (
                      <span className="tags-placeholder">Назначить...</span>
                    )}
                  </div>
                </div>

                {isAssigneeDropdownOpen && (
                  <div className="tags-dropdown">
                    <span className="field-hint">
                      Начните вводить имя или email, чтобы найти участника пространства.
                    </span>
                    <div className="assignee-search">
                      <input
                        type="text"
                        className="assignee-search-input"
                        placeholder="Поиск исполнителя..."
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="existing-tags">
                      <div className="existing-tags-list">
                        {membersLoading ? (
                          <div className="dropdown-status">Загрузка участников...</div>
                        ) : membersError ? (
                          <div className="dropdown-status error">{membersError}</div>
                        ) : !workspaceId ? (
                          <div className="dropdown-status">Нет активного пространства</div>
                        ) : filteredMembers.length ? (
                          filteredMembers.map((member) => (
                            <div
                              key={member.user_id}
                              className="existing-tag-item user-suggestion"
                              onClick={() => handleAssigneeSelect(member)}
                            >
                              <span className="tag-label">
                                {formatMemberName(member)}
                                {member.email && (
                                  <span className="member-email">{member.email}</span>
                                )}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="dropdown-status">Участники не найдены</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Дата</span>
              <div className="tags-dropdown-container" ref={dateDropdownRef}>
                <div className="tags-main-row" onClick={() => setIsDateDropdownOpen((prev) => !prev)}>
                  <div className="tags-list">
                    {dueDate ? (
                      <span className="tag-item date-tag">
                        {formatDateOnly(dueDate)}
                        <button className="tag-remove" onClick={handleDueDateClear}>
                          ×
                        </button>
                      </span>
                    ) : (
                      <span className="tags-placeholder">Выбрать дату...</span>
                    )}
                  </div>
                </div>

                {isDateDropdownOpen && (
                  <div className="tags-dropdown calendar-dropdown">
                    <Calendar
                      onChange={handleDueDateSelect}
                      value={dueDate ? new Date(dueDate) : new Date()}
                      locale="ru-RU"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Приоритет</span>
              <div className="tags-dropdown-container" ref={priorityDropdownRef}>
                <div
                  className="tags-main-row"
                  onClick={() => setIsPriorityDropdownOpen((prev) => !prev)}
                >
                  <div className="tags-list">
                    {priority ? (
                      <span
                        className={`tag-item priority-tag ${
                          priority === "high"
                            ? "priority-high"
                            : priority === "medium"
                            ? "priority-medium"
                            : "priority-low"
                        }`}
                      >
                        {priority === "high"
                          ? "Высокий"
                          : priority === "medium"
                          ? "Средний"
                          : "Низкий"}
                        <button className="tag-remove" onClick={handlePriorityClear}>
                          ×
                        </button>
                      </span>
                    ) : (
                      <span className="tags-placeholder">Пусто...</span>
                    )}
                  </div>
                </div>

                {isPriorityDropdownOpen && (
                  <div className="tags-dropdown">
                    <div className="existing-tags">
                      <div className="existing-tags-list">
                        {["high", "medium", "low"].map((level) => (
                          <div
                            key={level}
                            className={`existing-tag-item ${priority === level ? "selected" : ""}`}
                            onClick={() => handlePrioritySelect(level)}
                          >
                            <span className="tag-label">
                              {level === "high"
                                ? "Высокий"
                                : level === "medium"
                                ? "Средний"
                                : "Низкий"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="task-section">
            <div className="detail-item">
              <span className="detail-label">Теги</span>
              <div className="tags-dropdown-container" ref={tagsDropdownRef}>
                <div className="tags-main-row" onClick={() => setIsTagsDropdownOpen((prev) => !prev)}>
                  <div className="tags-list">
                    {selectedLabels.length ? (
                      selectedLabels.map((label) => (
                        <span
                          key={label.id}
                          className="tag-item"
                          style={label.color ? { backgroundColor: label.color, color: "#fff" } : undefined}
                        >
                          {label.name}
                          <button
                            className="tag-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLabelToggle(label);
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="tags-placeholder">Пусто...</span>
                    )}
                  </div>
                </div>

                {isTagsDropdownOpen && (
                  <div className="tags-dropdown">
                    <span className="field-hint">
                      Теги берутся из текущего рабочего пространства.
                    </span>
                    <div className="new-tag-input">
                      <input
                        type="text"
                        className="tag-input"
                        placeholder="Поиск по тегам..."
                        value={labelsSearch}
                        onChange={(e) => setLabelsSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="existing-tags">
                      <div className="existing-tags-list">
                        {labelsLoading ? (
                          <div className="dropdown-status">Загрузка тегов...</div>
                        ) : labelsError ? (
                          <div className="dropdown-status error">{labelsError}</div>
                        ) : !workspaceId ? (
                          <div className="dropdown-status">Нет активного пространства</div>
                        ) : filteredLabels.length ? (
                          <>
                            {filteredLabels.map((label) => {
                              const isChecked = selectedLabels.some((item) => item.id === label.id);
                              return (
                                <label
                                  key={label.id}
                                  className={`existing-tag-item ${isChecked ? "selected" : ""}`}
                                  onClick={() => handleLabelToggle(label)}
                                >
                                  <span className="tag-color-dot" style={{ backgroundColor: label.color || "#d1d5db" }} />
                                  <span className="tag-label">{label.name}</span>
                                </label>
                              );
                            })}
                            {canCreateNewLabel && (
                              <div
                                className="existing-tag-item create-tag-item"
                                onClick={handleCreateLabel}
                                style={{ cursor: isCreatingLabel ? "wait" : "pointer" }}
                              >
                                <span className="tag-label">
                                  {isCreatingLabel ? "Создание..." : `+ Создать тег "${labelsSearch}"`}
                                </span>
                              </div>
                            )}
                          </>
                        ) : canCreateNewLabel ? (
                          <div
                            className="existing-tag-item create-tag-item"
                            onClick={handleCreateLabel}
                            style={{ cursor: isCreatingLabel ? "wait" : "pointer" }}
                          >
                            <span className="tag-label">
                              {isCreatingLabel ? "Создание..." : `+ Создать тег "${labelsSearch}"`}
                            </span>
                          </div>
                        ) : (
                          <div className="dropdown-status">Теги не найдены</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="task-section">
            <h3>Описание</h3>
            <textarea
              className="description-input"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Добавьте описание задачи..."
              rows="4"
              ref={(textarea) => {
                if (textarea) {
                  textarea.style.height = "auto";
                  textarea.style.height = `${textarea.scrollHeight}px`;
                }
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />
          </div>

          <div className="task-section comments-section-bottom">
            <h3>Комментарии</h3>
            <div className="comments-container">
              <div className="comment-input-section">
                <textarea
                  className="comment-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Напишите комментарий..."
                  rows="3"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleCreateComment();
                    }
                  }}
                />
                <button
                  className="comment-submit-btn"
                  onClick={handleCreateComment}
                  disabled={!newComment.trim() || isCreatingComment}
                >
                  {isCreatingComment ? "Отправка..." : "Отправить"}
                </button>
              </div>
              <div className="comment-display">
                {comments.length ? (
                  <ul className="comment-list">
                    {comments.map((comment) => (
                      <li key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-author">{formatCommentUser(comment.user)}</span>
                          <span className="comment-date">{formatDateTime(comment.created_at)}</span>
                        </div>
                        <div className="comment-text">{comment.content || "—"}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="comment-placeholder">Комментариев пока нет</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}