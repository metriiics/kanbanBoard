import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Settings() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const navigate = useNavigate();

  const sections = [
    { key: 'profile', label: 'Профиль' },
    { key: 'security', label: 'Безопасность' },
    { key: 'notifications', label: 'Уведомления' },
    { key: 'appearance', label: 'Оформление' },
  ];

  return (
    <div className="settings-page">
      <div className="settings-wrapper">
        <aside className="settings-menu">
          <div className="settings-header">
            <Link to={`/${user.username}`} className="back-button-settings">
              ← Назад
            </Link>
            <h2>Настройки</h2>
          </div>
          <ul>
            {sections.map((item) => (
              <li
                key={item.key}
                className={activeSection === item.key ? 'active' : ''}
                onClick={() => setActiveSection(item.key)}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </aside>

        <main className="settings-content">
          {activeSection === 'profile' && (
            <div>
              <h3>Профиль</h3>
              <p>Здесь вы можете изменить имя, email и другие личные данные.</p>
            </div>
          )}
          {activeSection === 'security' && (
            <div>
              <h3>Безопасность</h3>
              <p>Управляйте паролем и двухфакторной аутентификацией.</p>
            </div>
          )}
          {activeSection === 'notifications' && (
            <div>
              <h3>Уведомления</h3>
              <p>Настройте, какие уведомления вы хотите получать.</p>
            </div>
          )}
          {activeSection === 'appearance' && (
            <div>
              <h3>Оформление</h3>
              <p>Выберите тему, шрифт и цветовую схему приложения.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}