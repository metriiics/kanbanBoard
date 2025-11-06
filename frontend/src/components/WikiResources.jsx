import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Wiki() {
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const topics = {
    overview: {
      title: 'Общие сведения',
      content:
        'Этот раздел содержит основную информацию о системе, её структуре и функциональности.',
    },
    projects: {
      title: 'Работа с проектами',
      content:
        'Здесь вы узнаете, как создавать, редактировать и удалять проекты, а также управлять задачами внутри них.',
    },
    profile: {
      title: 'Настройка профиля',
      content:
        'Раздел описывает, как изменить личные данные, аватар и настройки безопасности.',
    },
    users: {
      title: 'Управление пользователями',
      content:
        'Информация о создании и настройке пользователей, ролей и прав доступа.',
    },
    api: {
      title: 'API',
      content:
        'Описание API, примеры запросов и советы по интеграции с внешними системами.',
    },
    faq: {
      title: 'FAQ',
      content:
        'Часто задаваемые вопросы и их решения, советы по работе с платформой.',
    },
  };

  const toggleMenu = (key) => {
    setOpenMenu(openMenu === key ? null : key);
  };

  const handleSelect = (key) => {
    setSelectedTopic(key);

    if (!['projects', 'profile', 'users'].includes(key)) {
        setOpenMenu(null);
    } else {
        setOpenMenu('guides');
    }
  };

  return (
    <div className="wiki-page">
        <Link to={`/`} className="back-button">
            ←Назад
        </Link>
        <div className="wiki-container">
            <aside className="wiki-sidebar">
                <h2>Wiki</h2>
                <ul className="wiki-nav">
                    <li
                        className={`wiki-nav-item ${
                            selectedTopic === 'overview' ? 'active' : ''
                        }`}
                        onClick={() => handleSelect('overview')}
                        >
                        Общие сведения
                    </li>

                    <li
                        className={`wiki-nav-item has-sub ${
                            openMenu === 'guides' ? 'open' : ''
                        }`}
                        onClick={() => toggleMenu('guides')}
                        >
                        Инструкции

                        <ul
                            className={`wiki-sub-menu ${
                            openMenu === 'guides' ? 'visible' : ''
                            }`}
                        >
                            <li onClick={(e) => { e.stopPropagation(); handleSelect('projects'); }}>
                                Работа с проектами
                            </li>
                            <li onClick={(e) => { e.stopPropagation(); handleSelect('profile'); }}>
                                Настройка профиля
                            </li>
                            <li onClick={(e) => { e.stopPropagation(); handleSelect('users'); }}>
                                Управление пользователями
                            </li>
                        </ul>
                    </li>

                    <li
                        className={`wiki-nav-item ${
                            selectedTopic === 'api' ? 'active' : ''
                        }`}
                        onClick={() => handleSelect('api')}
                        >
                        API
                    </li>
                    <li
                        className={`wiki-nav-item ${
                            selectedTopic === 'faq' ? 'active' : ''
                        }`}
                        onClick={() => handleSelect('faq')}
                        >
                        FAQ
                    </li>
                </ul>
            </aside>

            <main className="wiki-content">
                {selectedTopic ? (
                    <>
                    <h3>{topics[selectedTopic].title}</h3>
                    <p>{topics[selectedTopic].content}</p>
                    </>
                ) : (
                    <>
                    <h3>Документация</h3>
                    <p>
                        Здесь собраны разделы справки, руководства и примеры использования
                        системы.
                    </p>
                    </>
                )}
            </main>
        </div>
    </div>
  );
}
