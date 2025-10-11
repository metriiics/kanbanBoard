import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Registration() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
  });

  const { register, user, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => () => setError(''), [setError]);

  function handleChange(e) {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { first_name, last_name, username, email, password } = formData;

    if (!first_name || !last_name || !username || !email || !password) {
      setError('Все поля обязательны для заполнения');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    const result = await register(first_name, last_name, username, email, password);
    if (result.success) navigate('/');
  }

  return (
    <div className="registration-container">
      <div className="registration-form">
        <h2>Регистрация</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="first_name">Имя:</label>
            <input
              type="text"
              id="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Введите имя"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Фамилия:</label>
            <input
              type="text"
              id="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Введите фамилию"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Имя пользователя:</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Введите имя пользователя"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Введите ваш email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите пароль"
              disabled={loading}
            />
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="login-link">
          Уже есть аккаунт? <Link to="/login">Войдите</Link>
        </p>
      </div>
    </div>
  );
}
