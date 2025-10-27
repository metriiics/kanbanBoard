import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user, loading, error, setError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => setError('');
  }, [setError]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password) {
      setError('Все поля обязательны для заполнения');
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      // подождём пока AuthContext обновится
      setTimeout(() => {
        navigate('/');
      }, 0);
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Вход в систему</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите ваш email" 
              disabled={loading}
            />
          </div>

          <div className="form-group password-group">
            <label htmlFor="password">Пароль:</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                disabled={loading}
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="register-link">
          Нет аккаунта? <Link to="/registration">Зарегистрируйтесь</Link>
        </p>
      </div>
      <div className='politic-confirmation'>
        <p className="terms-text">
          Продолжая использовать <span className="brand">TaskFusion</span>, Вы принимаете условия{' '}
          <Link to="/documents/privacy" target="_blank">Политики конфиденциальности</Link>.
        </p>
      </div>
    </div>
  );
}