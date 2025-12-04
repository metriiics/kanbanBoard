import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useUserRole } from '../hooks/h_userRole';
import ProfileSettings from './SectionSettings/ProfileSettings';
import AppearanceSettings from './SectionSettings/AppearanceSettings';
import MembersSettings from './SectionSettings/MembersSettings';
import NotificationsSettings from './SectionSettings/NotificationsSettings';
import BillingSettings from './SectionSettings/BillingSettings';
import BoardsSettings from './SectionSettings/BoardsSettings';
import SettingsWorkspace from './SectionSettings/SettingsWorkspace';
import PageLoader from './PageLoader';

export default function Settings() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { isOwner } = useUserRole();
  const [activeSection, setActiveSection] = useState('profile');
  const navigate = useNavigate();

  // Редирект не-владельцев на главную страницу workspace
  useEffect(() => {
    if (!loading && user && !isOwner) {
      navigate(`/${user.username || ''}`);
    }
  }, [loading, user, isOwner, navigate]);

  const personalSections = [
    { key: 'profile', label: 'Профиль' },
    { key: 'appearance', label: 'Оформление' },
  ];

  const workspaceSections = [
    { key: 'boards', label: 'Доски' },
    { key: 'members', label: 'Участники' },
    { key: 'settings_workspace', label: 'Настройки' },
    { key: 'notifications', label: 'Уведомления' },
    { key: 'billing', label: 'Оплата' },
  ];

  const renderSection = () => {
    // Не-владельцы могут видеть только персональные настройки
    if (!isOwner && (activeSection === 'members' || activeSection === 'boards' || activeSection === 'settings_workspace' || activeSection === 'notifications' || activeSection === 'billing')) {
      return <div>У вас нет доступа к этим настройкам</div>;
    }

    switch (activeSection) {
      case 'profile': return <ProfileSettings />;
      case 'appearance': return <AppearanceSettings />;
      case 'members': return <MembersSettings />;
      case 'boards': return <BoardsSettings />;
      case 'settings_workspace': return <SettingsWorkspace />;
      case 'notifications': return <NotificationsSettings />;
      case 'billing': return <BillingSettings />;
      default: return null;
    }
  };

  if (loading) {
    return <PageLoader message="Загружаем настройки..." variant="full" />;
  }

  if (!user) {
    return (
      <div className="settings-page">
        <div className="settings-wrapper">
          <p>Пользователь не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-wrapper">
        <aside className="settings-menu">
          <div className="settings-header">
            <Link to={`/${user?.username || ''}`} className="back-button-settings">
              ← Назад
            </Link>
          </div>

          <h3 className="menu-group-title">Персональные настройки</h3>
          <ul>
            {personalSections.map((item) => (
              <li
                key={item.key}
                className={activeSection === item.key ? 'active' : ''}
                onClick={() => setActiveSection(item.key)}
              >
                {item.label}
              </li>
            ))}
          </ul>

          {isOwner && (
            <>
              <h3 className="menu-group-title">Рабочее пространство</h3>
              <ul>
                {workspaceSections.map((item) => (
                  <li
                    key={item.key}
                    className={activeSection === item.key ? 'active' : ''}
                    onClick={() => setActiveSection(item.key)}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>

        <main className="settings-content">{renderSection()}</main>
      </div>
    </div>
  );
}