import { useEffect, useState } from 'react';
import { useCurrentUser } from '../../hooks/h_useCurrentUser';

export default function ProfileSettings() {
  const { user, loading, error } = useCurrentUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);

  // При загрузке данных пользователя
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ firstName, lastName, username, email, bio, avatar });
    // TODO: добавить PATCH /api/users/me
  };

  if (loading) {
    return <div className="profile-settings"><p>Загрузка данных...</p></div>;
  }

  if (error) {
    return <div className="profile-settings"><p>Ошибка при загрузке профиля 😔</p></div>;
  }

  if (!user) {
    return <div className="profile-settings"><p>Пользователь не найден</p></div>;
  }

  return (
    <div className="profile-settings">
      <h3 className="profile-title">Профиль</h3>
      <p className="profile-description">
        Измените ваши персональные данные и фото профиля.
      </p>

      <form onSubmit={handleSubmit} className="profile-form">
        {/* === Аватар === */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">{initials}</div>
            )}
            <label htmlFor="avatar-upload" className="avatar-edit-label">
              Изм.
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              className="avatar-input"
            />
          </div>

          <div className="avatar-info">
            <h4 className="avatar-name">{firstName} {lastName}</h4>
            <p className="avatar-username">@{username}</p>
            <p className="avatar-email">{email}</p>
          </div>
        </div>

        {/* === Имя и фамилия === */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">Имя</label>
            <input
              id="firstName"
              type="text"
              className="form-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName" className="form-label">Фамилия</label>
            <input
              id="lastName"
              type="text"
              className="form-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        {/* === Никнейм === */}
        <div className="form-group">
          <label htmlFor="username" className="form-label">Никнейм</label>
          <input
            id="username"
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className="username-hint">
            Ваш никнейм используется в ссылке на профиль:
            <span className="username-link"> /{username}</span>
          </p>
        </div>

        {/* === Email === */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* === Кнопка === */}
        <button type="submit" className="save-button">
          Сохранить
        </button>
      </form>
    </div>
  );
}
