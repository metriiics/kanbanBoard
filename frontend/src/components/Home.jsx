import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import Marquee from 'react-fast-marquee';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  const features = [
    {
      icon: '🚀',
      title: 'Быстрый старт',
      description: 'Начни работу за минуты. Простая настройка и интуитивный интерфейс.'
    },
    {
      icon: '📅',
      title: 'Управление задачами',
      description: 'Канбан-доски, календарь, дедлайны, приоритеты — всё под контролем.'
    },
    {
      icon: '👥',
      title: 'Совместная работа',
      description: 'Работай вместе с коллегами над проектами, обсуждай и принимай решения быстрее.'
    },
    {
      icon: '🎨',
      title: 'Гибкая настройка',
      description: 'Персонализируй рабочее пространство под себя и свою команду.'
    }
  ];

  const values = [
    {
      icon: '💡',
      title: 'Инновации',
      description: 'Мы экспериментируем и создаем новые подходы к работе над проектами.'
    },
    {
      icon: '🤝',
      title: 'Командность',
      description: 'Главное в успехе — это люди. Мы создаем пространство для совместной работы.'
    },
    {
      icon: '🌍',
      title: 'Глобальность',
      description: 'Наша цель — сделать эффективную работу доступной в любой точке мира.'
    }
  ];

  return (
    <div className="home-page">
      {/* === HEADER === */}
      <header className="home-header">
        <div className="logo">
          <span className="logo-text">TaskFusion</span>
        </div>

        <nav className="nav-right">
          {!isAuthenticated ? (
            <div className="nav-links">
              <Link to="/login">Войти</Link>
              <Link to="/registration" className="nav-link-primary">Регистрация</Link>
            </div>
          ) : (
            <div className="user-menu-container">
              <div
                className="user-avatar"
                onClick={() => setMenuOpen(!menuOpen)}
                title={user?.email}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="User avatar"
                    className="avatar-image"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                ) : (
                  <span className="avatar-initials">
                    {getInitials(user?.first_name || user?.username || 'U')}
                  </span>
                )}
              </div>

              {menuOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="user-name">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="logout-btn">
                    Выйти
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      {/* === HERO SECTION === */}
      <main className="home-main">
        <div className="hero-background" style={{ transform: `translateY(${scrollY * 0.5}px)` }}></div>
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span>✨ Современный менеджер задач</span>
            </div>
            <h1 className="main-title">
              {isAuthenticated ? (
                <>
                  Добро пожаловать, <span className="gradient-text">{user?.first_name || 'друг'}</span> 👋
                </>
              ) : (
                <>
                  Управляй проектами <span className="gradient-text">эффективно</span>
                </>
              )}
            </h1>
            <p className="main-subtitle">
              {isAuthenticated ? (
                'Перейди в своё рабочее пространство и продолжи работу над проектами.'
              ) : (
                'Всё в одном месте: задачи, команда, проекты. Современная альтернатива Jira, созданная для твоей продуктивности.'
              )}
            </p>

            {!isAuthenticated ? (
              <div className="cta-buttons">
                <Link to="/registration" className="btn-primary">
                  Начать
                </Link>
                <Link to="/login" className="btn-secondary">
                  Войти
                </Link>
              </div>
            ) : (
              <Link to={`/${user.username}`} className="btn-workspace">
                Перейти в пространство →
              </Link>
            )}

            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Надежность</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">∞</div>
                <div className="stat-label">Проектов</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Доступ</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-card card-1">
              <div className="card-icon">📋</div>
              <div className="card-text">Задачи</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">👥</div>
              <div className="card-text">Команда</div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">🏷️</div>
              <div className="card-text">Теги</div>
            </div>
            <div className="hero-gradient-orb orb-1"></div>
            <div className="hero-gradient-orb orb-2"></div>
          </div>
        </div>
      </main>

      {/* === MARQUEE === */}
      <section className="marquee-section">
        <Marquee pauseOnHover={true} speed={50} gradient={false}>
          <span className="marquee-item">🎯 Продуктивность на новом уровне</span>
          <span className="marquee-item">💬 Простая коммуникация внутри команды</span>
          <span className="marquee-item">⚙️ Автоматизация процессов</span>
          <span className="marquee-item">🎨 Гибкая настройка</span>
          <span className="marquee-item">📱 Работа на всех устройствах</span>
          <span className="marquee-item">✅ Просто работает</span>
          <span className="marquee-item">🔄 Синхронизация в реальном времени</span>
          <span className="marquee-item">📅 Календарь задач</span>
          <span className="marquee-item">👤 Назначение исполнителей</span>
          <span className="marquee-item">🔔 Уведомления</span>
        </Marquee>
      </section>

      {/* === FEATURES === */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Почему выбирают нас</h2>
          <p className="section-subtitle">Всё, что нужно для эффективной работы команды</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === ABOUT SECTION === */}
      <section className="about-section">
        <div className="about-content">
          <div className="about-text">
            <div className="about-badge">О нас</div>
            <h2 className="about-title">TaskFusion — это больше, чем менеджер задач</h2>
            <p className="about-description">
              Мы создаем инструменты для команд, которым важны скорость, фокус и прозрачность.  
              TaskFusion — это не просто менеджер задач, это экосистема для всей команды.  
              Мы вдохновлены гибкостью стартапов и структурой корпораций.
            </p>
          </div>
        </div>

        <div className="values-grid">
          {values.map((value, index) => (
            <div key={index} className="value-card">
              <div className="value-icon">{value.icon}</div>
              <h3 className="value-title">{value.title}</h3>
              <p className="value-description">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === WIKI SECTION === */}
      <section className="wiki-section">
        <div className="wiki-content">
          <h2 className="wiki-title">Узнай больше о TaskFusion</h2>
          <p className="wiki-description">
            Мы подробно описали все возможности платформы, принципы работы и советы по повышению эффективности в нашей Wiki.  
            Изучи гайды, чтобы максимально использовать потенциал TaskFusion.
          </p>
          <Link to="/wiki" className="btn-wiki">
            Перейти в Wiki →
          </Link>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="logo-text">TaskFusion</span>
          </div>
          <p className="footer-text">© {new Date().getFullYear()} TaskFusion. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
