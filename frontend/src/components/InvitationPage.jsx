import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getInviteInfo, acceptInvite } from "../api/a_invites";
import { useAuth } from "../contexts/AuthContext";

export default function InvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionStatus, setActionStatus] = useState({ state: "idle", message: "" });

  useEffect(() => {
    let isMounted = true;

    async function fetchInvite() {
      try {
        setLoading(true);
        const data = await getInviteInfo(token);
        if (isMounted) {
          setInviteInfo(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.detail || "Приглашение не найдено или устарело");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (token) {
      fetchInvite();
    } else {
      setLoading(false);
      setError("Некорректный токен приглашения");
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      setActionStatus({
        state: "error",
        message: "Чтобы принять приглашение, войдите в аккаунт.",
      });
      return;
    }
    try {
      setActionStatus({ state: "loading", message: "" });
      const response = await acceptInvite(token);
      if (response?.status === "already_member") {
        setActionStatus({
          state: "success",
          message: "Вы уже состоите в этом пространстве.",
        });
        setTimeout(() => navigate(`/${user.username}`), 800);
        return;
      }
      setActionStatus({
        state: "success",
        message: "Приглашение принято! Перенаправляем...",
      });
      setTimeout(() => navigate(`/${user.username}`), 800);
    } catch (err) {
      const detail = err?.response?.data?.detail || "Не удалось принять приглашение";
      setActionStatus({ state: "error", message: detail });
    }
  };

  const handleDecline = () => {
    navigate("/");
  };

  return (
    <div className="invitation-page">
      <div className="invitation-card">
        {loading && <div className="invitation-status">Загружаем приглашение...</div>}

        {!loading && error && (
          <>
            <h2>Приглашение недоступно</h2>
            <p className="invitation-message">{error}</p>
            <Link to="/" className="invitation-link">
              Вернуться на главную
            </Link>
          </>
        )}

        {!loading && inviteInfo && !error && (
          <>
            <h2>Вас пригласили</h2>
            <p className="invitation-message">
              Рабочее пространство: <strong>{inviteInfo.workspace_name || "Без названия"}</strong>
            </p>
            {inviteInfo.creator_name && (
              <p className="invitation-meta">
                Отправитель: <strong>{inviteInfo.creator_name}</strong>
              </p>
            )}
            {!inviteInfo.is_active && (
              <p className="invitation-message warning">
                Ссылка деактивирована владельцем рабочего пространства.
              </p>
            )}

            {!isAuthenticated && (
              <div className="invitation-hint">
                У вас ещё нет аккаунта? <Link to="/registration">Зарегистрируйтесь</Link> или{" "}
                <Link to="/login">войдите</Link>, чтобы принять приглашение.
              </div>
            )}

            {actionStatus.message && (
              <div
                className={`invitation-alert ${
                  actionStatus.state === "error" ? "error" : "success"
                }`}
              >
                {actionStatus.message}
              </div>
            )}

            <div className="invitation-actions">
              <button
                className="accept-btn"
                onClick={handleAccept}
                disabled={actionStatus.state === "loading" || !inviteInfo.is_active}
              >
                {actionStatus.state === "loading" ? "Принимаем..." : "Принять приглашение"}
              </button>
              <button className="decline-btn" onClick={handleDecline}>
                Отклонить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

