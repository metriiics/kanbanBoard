import React, { useState, useRef, useEffect } from 'react';
import Calendar from 'react-calendar';
import { useTasks } from "../hooks/h_useTasks";

export default function TaskModal({ task, isOpen, onClose, isRightAligned, onToggleAlignment }) {
  const [description, setDescription] = useState(task?.description || '');
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [tags, setTags] = useState(task?.labels || []);
  const [newTag, setNewTag] = useState('');
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { updateTask } = useTasks();
  const [isSaving, setIsSaving] = useState(false);

  // Для полей исполнителя и приоритета
  const [assignee, setAssignee] = useState(task?.assignee || '');
  const [priority, setPriority] = useState(task?.priority || '');
  const [availableAssignees] = useState(['Алексей', 'Марина', 'Игорь', 'София', 'Дмитрий']);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const filteredAssignees = availableAssignees.filter(user =>
    user.toLowerCase().includes(assigneeSearch.toLowerCase())
  );
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  const [existingTags] = useState([
    'срочно', 'важно', 'баг', 'фича', 'дизайн', 
    'разработка', 'тестирование', 'документация'
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTagsDropdownOpen(false);
      }
    };

    if (isTagsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTagsDropdownOpen])

  if (!isOpen || !task) return null;

  // Функция для добавления тега
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Функция для обработки Enter
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Функция для удаления тега
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <>
      {/* Затемнение фона */}
      <div className={`modal-overlay ${isRightAligned ? 'right-aligned' : ''}`} onClick={onClose} />
      
      {/* Модальное окно как правый сайдбар */}
      <div 
        className={`task-modal ${isRightAligned ? 'right-sidebar' : 'centered'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок модалки */}
        <div className="modal-header">
          <div className="modal-title">
            <h2>{task.title}</h2>

            <div className="task-meta-header">
              <span className="created-date">
                Создано: {new Date(task.createdAt).toLocaleDateString()}
              </span>

              <div className="meta-separator">•</div>

              <span className="meta-project">
                Проект: <strong>{task.projectName || 'Без проекта'}</strong>
              </span>

              <div className="meta-separator">•</div>

              <span className="meta-board">
                Доска: <strong>{task.boardName || 'Без доски'}</strong>
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              className="align-btn"
              onClick={onToggleAlignment}
              title={isRightAligned ? 'Вернуть в центр' : 'Сместить вправо'}
            >
              {isRightAligned ? '⤢' : '⤡'}
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>


        {/* Контент модалки */}
        <div className="modal-content">

          {/* Детали задачи */}
          <div className="task-details">
            {/* Исполнитель */}
            <div className="detail-item">
              <span className="detail-label">Исполнитель</span>
              <div className="tags-dropdown-container" ref={dropdownRef}>
                {/* Основная строка */}
                <div
                  className="tags-main-row"
                  onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                >
                  <div className="tags-list">
                    {assignee ? (
                      <span className="tag-item assignee-tag">
                        {assignee}
                        <button
                          className="tag-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignee('');
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <span className="tags-placeholder">Назначить...</span>
                    )}
                  </div>
                </div>

                {/* Выпадающее меню с поиском */}
                {isAssigneeDropdownOpen && (
                  <div className="tags-dropdown">
                    {/* Поле поиска */}
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

                    {/* Список исполнителей */}
                    <div className="existing-tags">
                      <div className="existing-tags-list">
                        {filteredAssignees.length > 0 ? (
                          filteredAssignees.map((user, index) => (
                            <label
                              key={index}
                              className="existing-tag-item"
                              onClick={() => {
                                setAssignee(user);
                                setIsAssigneeDropdownOpen(false);
                              }}
                            >
                              <input
                                type="radio"
                                checked={assignee === user}
                                onChange={() => setAssignee(user)}
                              />
                              <span className="tag-label">{user}</span>
                            </label>
                          ))
                        ) : (
                          <div className="no-results">Нет совпадений</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Дата выполнения */}
            <div className="detail-item">
              <span className="detail-label">Дата</span>
              <div className="tags-dropdown-container">
                <div
                  className="tags-main-row"
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                >
                  <div className="tags-list">
                    {dueDate ? (
                      <span className="tag-item date-tag">
                        {new Date(dueDate).toLocaleDateString()}
                        <button
                          className="tag-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDueDate('');
                          }}
                        >
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
                      onChange={(date) => {
                        setDueDate(date.toISOString());
                        setIsDateDropdownOpen(false);
                      }}
                      value={dueDate ? new Date(dueDate) : new Date()}
                      locale="ru-RU"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Приоритет */}
            <div className="detail-item">
              <span className="detail-label">Приоритет</span>
              <div className="tags-dropdown-container" ref={dropdownRef}>
                {/* Основная строка */}
                <div
                  className="tags-main-row"
                  onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                >
                  <div className="tags-list">
                    {priority ? (
                      <span
                        className={`tag-item priority-tag ${
                          priority === 'high'
                            ? 'priority-high'
                            : priority === 'medium'
                            ? 'priority-medium'
                            : 'priority-low'
                        }`}
                      >
                        {priority === 'high'
                          ? 'Высокий'
                          : priority === 'medium'
                          ? 'Средний'
                          : 'Низкий'}
                        <button
                          className="tag-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPriority('');
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <span className="tags-placeholder">Пусто...</span>
                    )}
                  </div>
                </div>

                {/* Выпадающее меню */}
                {isPriorityDropdownOpen && (
                  <div className="tags-dropdown">
                    <div className="existing-tags">
                      <div className="existing-tags-list">
                        {['high', 'medium', 'low'].map((level) => (
                          <div
                            key={level}
                            className={`existing-tag-item ${priority === level ? 'selected' : ''}`}
                            onClick={() => {
                              setPriority(level);
                              setIsPriorityDropdownOpen(false);
                            }}
                          >
                            <span className="tag-label">
                              {level === 'high'
                                ? 'Высокий'
                                : level === 'medium'
                                ? 'Средний'
                                : 'Низкий'}
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

          {/* Теги */}
          <div className="task-section">
            <div className="detail-item">
              <span className="detail-label">Теги</span>
              <div className="tags-dropdown-container" ref={dropdownRef}>
                {/* Основная строка с тегами */}
                <div 
                  className="tags-main-row"
                  onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
                >
                  <div className="tags-list">
                    {tags.length > 0 ? (
                      tags.map((tag, index) => (
                        <span key={index} className="tag-item">
                          {tag}
                          <button 
                            className="tag-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(tag);
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

                {/* Выпадающее меню */}
                {isTagsDropdownOpen && (
                  <div className="tags-dropdown">
                    {/* Добавление нового тега */}
                    <div className="add-new-tag">
                      <div className="new-tag-input">
                        <input
                          type="text"
                          className="tag-input"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={handleTagKeyPress}
                          placeholder="Введите название тега..."
                        />
                        <button 
                          className="btn btn-small"
                          onClick={handleAddTag}
                          disabled={!newTag.trim()}
                        >
                          Добавить
                        </button>
                      </div>
                    </div>

                    {/* Список существующих тегов */}
                    <div className="existing-tags">
                      <div className="existing-tags-list">
                        {existingTags.map((tag, index) => (
                          <label key={index} className="existing-tag-item">
                            <input
                              type="checkbox"
                              checked={tags.includes(tag)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTags([...tags, tag]);
                                } else {
                                  setTags(tags.filter(t => t !== tag));
                                }
                              }}
                            />
                            <span className="tag-label">{tag}</span>
                          </label>
                        ))}
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Добавьте описание задачи..."
              rows="4"
              ref={(textarea) => {
                if (textarea) {
                  // Автоматическое изменение высоты при загрузке
                  textarea.style.height = 'auto';
                  textarea.style.height = textarea.scrollHeight + 'px';
                }
              }}
              onInput={(e) => {
                // Автоматическое изменение высоты при вводе
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>

          <div className="task-section comments-section-bottom">
            <h3>Комментарии</h3>
            <div className="comments-container">
              <div className="comment-display">
                {comment ? (
                  <div className="comment-text">
                    {comment}
                  </div>
                ) : (
                  <div className="comment-placeholder">
                    Комментариев пока нет
                  </div>
                )}
              </div>
              
              <div className="comment-input-section">
                <textarea
                  className="comment-input"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Напишите комментарий..."
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '40px',
                    maxHeight: '120px'
                  }}
                  onInput={(e) => {
                    // Автоматическое изменение высоты
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />
                <button 
                  className="btn btn-primary"
                  disabled={!comment.trim()}
                >
                  Добавить комментарий
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}