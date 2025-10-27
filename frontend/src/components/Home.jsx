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
          <h2>О компании TaskFusion</h2>
          <p>
            Мы создаем инструменты для команд, которым важны скорость, фокус и прозрачность.  
            TaskFusion — это не просто менеджер задач, это экосистема для всей команды.  
            Мы вдохновлены гибкостью стартапов и структурой корпораций.
          </p>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <h3>💡 Инновации</h3>
            <p>Мы экспериментируем и создаем новые подходы к работе над проектами.</p>
          </div>
          <div className="about-card">
            <h3>🤝 Командность</h3>
            <p>Главное в успехе — это люди. Мы создаем пространство для совместной работы.</p>
          </div>
          <div className="about-card">
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

      {/* === TEAM SECTION === */}
      <section className="team-section">
        <h2>Наша команда</h2>
        <div className="team-grid">
          {[
            { name: "Alexsey Go Pro", img: "/img/me.png" },
            { name: "Dmitro Sckrinik", img: "/img/dimm.png" },
            { name: "Alexandro MGS", img: "/img/ssh.png" },
            { name: "Vlad ******", img: "/img/vlad.png" },
            { name: "Angel", img: "/img/angel.png" },
          ].map((member, idx) => (
            <div className="team-card" key={idx}>
              <div className="team-photo">
                <img src={member.img} alt={member.name} />
              </div>
              <p className="team-name">{member.name}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <p>© {new Date().getFullYear()} TaskFusion. All rights reserved.</p>
      </footer>
    </div>
  );
}
