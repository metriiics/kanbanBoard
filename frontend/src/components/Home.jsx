import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import Marquee from 'react-fast-marquee';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="home-page">
      {/* === HEADER === */}
      <header className="home-header">
        <div className="logo">
          <span className="logo-icon">🧩</span>
          <span className="logo-text">TaskFusion</span>
        </div>

        <nav className="nav-right">
          {!isAuthenticated ? (
            <div className="nav-links">
              <Link to="/login">Login</Link>
              <Link to="/registration">Sign Up</Link>
            </div>
          ) : (
            <div className="user-menu-container">
              <div
                className="user-avatar"
                onClick={() => setMenuOpen(!menuOpen)}
                title={user?.email}
              >
                {getInitials(user?.first_name || user?.username || 'U')}
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
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="main-title fade-in">
              Добро пожаловать{user ? `, ${user.first_name}` : ''} 👋
            </h1>

            {!isAuthenticated ? (
              <>
                <p className="main-subtitle fade-in-delay">
                  Управляй проектами, командой и задачами — всё в одном месте.  
                  Современная альтернатива Jira, созданная для твоей продуктивности.
                </p>

                <div className="cta-buttons">
                  <Link to="/login" className="btn-primary">Войти</Link>
                  <Link to="/registration" className="btn-secondary">Регистрация</Link>
                </div>
              </>
            ) : (
              <div className="workspace-card fade-in-delay">
                <h2>Готов начать?</h2>
                <p>Перейди в своё рабочее пространство и продолжи работу над проектами.</p>
                <Link to={`/${user.username}`} className="btn-workspace">
                  Перейти в пространство →
                </Link>
              </div>
            )}
          </div>

          <div className="hero-image fade-in-delay">
            <img src="/img/pc1.png" alt="Task board preview" />
          </div>
        </div>
      </main>

      {/* === MARQUEE === */}
      <section className="marquee-section">
        <Marquee pauseOnHover={true} speed={45} gradient={false}>
          <span className="marquee-item">🚀 Быстрее, чем Jira</span>
          <span className="marquee-item">🎯 Продуктивность на новом уровне</span>
          <span className="marquee-item">💬 Простая коммуникация внутри команды</span>
          <span className="marquee-item">📊 Умная аналитика</span>
          <span className="marquee-item">🔒 Безопасность данных</span>
          <span className="marquee-item">⚙️ Автоматизация процессов</span>
        </Marquee>
      </section>

      {/* === ABOUT SECTION === */}
      <section className="about-section">
        <div className="about-content">
          <div className="about-text">
            <h2>О компании TaskFusion</h2>
            <p>
              Мы создаем инструменты для команд, которым важны скорость, фокус и прозрачность.  
              TaskFusion — это не просто менеджер задач, это экосистема для всей команды.  
              Мы вдохновлены гибкостью стартапов и структурой корпораций.
            </p>
          </div>
          <div className="about-image">
            <img src="/img/pc2.png" alt="Team collaboration illustration" />
          </div>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <img src="/img/pc3.png" alt="Innovation" />
            <h3>💡 Инновации</h3>
            <p>Мы экспериментируем и создаем новые подходы к работе над проектами.</p>
          </div>
          <div className="about-card">
            <img src="/img/pc4.png" alt="Teamwork" />
            <h3>🤝 Командность</h3>
            <p>Главное в успехе — это люди. Мы создаем пространство для совместной работы.</p>
          </div>
          <div className="about-card">
            <img src="/img/pc5.png" alt="Global reach" />
            <h3>🌍 Глобальность</h3>
            <p>Наша цель — сделать эффективную работу доступной в любой точке мира.</p>
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="features">
        <h2>Почему выбирают нас</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <img src="/img/pc6.png" alt="Realtime updates" />
            <h3>⚡ Мгновенные обновления</h3>
            <p>Изменения отображаются в реальном времени. Без перезагрузки страницы.</p>
          </div>
          <div className="feature-card">
            <h3>📅 Управление задачами</h3>
            <p>Канбан-доски, дедлайны, приоритеты — всё под контролем.</p>
          </div>
          <div className="feature-card">
            <h3>👥 Совместная работа</h3>
            <p>Работай вместе с коллегами над проектами, обсуждай и принимай решения быстрее.</p>
          </div>
          <div className="feature-card">
            <h3>📈 Аналитика</h3>
            <p>Следи за прогрессом и производительностью команды в удобных графиках.</p>
          </div>
        </div>
      </section>

      {/* === WIKI SECTION === */}
      <section className="wiki-section">
        <h2>📚 Узнай больше о TaskFusion</h2>
        <p>
          Мы подробно описали все возможности платформы, принципы работы и советы по повышению эффективности в нашей Wiki.  
          Изучи гайды, чтобы максимально использовать потенциал TaskFusion.
        </p>
        <Link to="/wiki" className="btn-wiki">
          Перейти в Wiki →
        </Link>
      </section>

      <footer className="home-footer">
        <p>© {new Date().getFullYear()} TaskFusion</p>
      </footer>
    </div>
  );
}
