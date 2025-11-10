import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import ProfileSettings from './SectionSettings/ProfileSettings';
import AppearanceSettings from './SectionSettings/AppearanceSettings';
import MembersSettings from './SectionSettings/MembersSettings';
import NotificationsSettings from './SectionSettings/NotificationsSettings';
import BillingSettings from './SectionSettings/BillingSettings';
import BoardsSettings from './SectionSettings/BoardsSettings';
import SettingsWorkspace from './SectionSettings/SettingsWorkspace';

export default function Settings() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const navigate = useNavigate();

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

  return (
    <div className="settings-page">
      <div className="settings-wrapper">
        <aside className="settings-menu">
          <div className="settings-header">
            <Link to={`/${user.username}`} className="back-button-settings">
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
        </aside>

        <main className="settings-content">{renderSection()}</main>
      </div>
    </div>
  );
}