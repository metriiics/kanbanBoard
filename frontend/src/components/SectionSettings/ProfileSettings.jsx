import { useEffect, useState } from 'react';
import { useCurrentUser } from '../../hooks/h_useCurrentUser';

export default function ProfileSettings() {
  const { user, loading, error } = useCurrentUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null); // из базы
  const [previewAvatar, setPreviewAvatar] = useState(null); // только для новых файлов

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAvatar(user.avatar_url || null);
    }
  }, [user]);

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewAvatar(imageUrl);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      firstName,
      lastName,
      username,
      email,
      bio,
      avatar: previewAvatar || avatar,
    });
  };

  if (loading) return <div className="profile-settings"><p>Загрузка...</p></div>;
  if (error) return <div className="profile-settings"><p>Ошибка 😔</p></div>;
  if (!user) return <div className="profile-settings"><p>Пользователь не найден</p></div>;

  return (
    <div className="profile-settings">
      <h3 className="profile-title">Профиль</h3>
      <p className="profile-description">Измените ваши персональные данные и фото профиля.</p>

      <form onSubmit={handleSubmit} className="profile-form">
        {/* === Аватар === */}
        <div className="avatar-section-userSet">
          <div className="avatar-wrapper-userSet">
            {previewAvatar ? (
              <img src={previewAvatar} alt="New avatar preview" className="avatar-image-userSet" />
            ) : avatar ? (
              <img src={avatar} alt="User avatar" className="avatar-image-userSet" />
            ) : (
              <div className="avatar-placeholder-userSet">{initials}</div>
            )}
            <label htmlFor="avatar-upload" className="avatar-edit-label-userSet">
              Изм.
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              className="avatar-input-hidden"
            />
          </div>

          <div className="avatar-info-userSet">
            <h4 className="avatar-name-userSet">{firstName} {lastName}</h4>
            <p className="avatar-username-userSet">@{username}</p>
            <p className="avatar-email-userSet">{email}</p>
          </div>
        </div>

        {/* Остальная форма */}
        <div className="form-row-userSet">
          <div className="form-group-userSet">
            <label htmlFor="firstName" className="form-label-userSet">Имя</label>
            <input
              id="firstName"
              type="text"
              className="form-input-userSet"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="form-group-userSet">
            <label htmlFor="lastName" className="form-label-userSet">Фамилия</label>
            <input
              id="lastName"
              type="text"
              className="form-input-userSet"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group-userNi">
          <label htmlFor="username" className="form-label-userNi">Никнейм</label>
          <input
            id="username"
            type="text"
            className="form-input-userNi"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className="username-hint-userNi">
            Ваш никнейм используется в ссылке на профиль:
            <span className="username-link-userNi"> /{username}</span>
          </p>
        </div>

        <div className="form-group-userEm">
          <label htmlFor="email" className="form-label-userEm">Email</label>
          <input
            id="email"
            type="email"
            className="form-input-userEm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button type="submit" className="save-button">Сохранить</button>
      </form>
    </div>
  );
}
