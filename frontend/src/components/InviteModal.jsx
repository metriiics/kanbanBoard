import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  createInviteLink,
  deleteInviteLink,
  getActiveInvite,
} from "../api/a_invites";

export default function InviteModal({ onClose, workspace }) {
  const [invite, setInvite] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchActiveInvite() {
      if (!workspace?.id) return;
      try {
        const data = await getActiveInvite(workspace.id);
        if (isMounted) {
          setInvite(data);
        }
      } catch (err) {
        if (err?.response?.status !== 404 && isMounted) {
          setStatus({
            state: "error",
            message:
              err?.response?.data?.detail ||
              "Не удалось загрузить текущую ссылку",
          });
        }
      }
    }

    fetchActiveInvite();
    return () => {
      isMounted = false;
    };
  }, [workspace?.id]);

  const copyToClipboard = async (value) => {
    if (!value) return false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleGenerateLink = async () => {
    if (!workspace?.id) {
      setStatus({
        state: "error",
        message: "Рабочее пространство не найдено",
      });
      return;
    }
    try {
      setLoading(true);
      const data = await createInviteLink(workspace.id);
      setInvite(data);
      setStatus({
        state: "success",
        message: "Новая ссылка создана. Скопируйте её и поделитесь с командой.",
      });
    } catch (err) {
      setStatus({
        state: "error",
        message: err?.response?.data?.detail || "Не удалось создать ссылку",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!invite?.invite_url) return;
    const copied = await copyToClipboard(invite.invite_url);
    setStatus({
      state: copied ? "success" : "error",
      message: copied
        ? "Ссылка скопирована в буфер обмена"
        : "Не удалось скопировать ссылку",
    });
  };

  const handleDeleteLink = async () => {
    if (!invite?.token) return;
    try {
      setLoading(true);
      await deleteInviteLink(invite.token);
      setInvite(null);
      setStatus({
        state: "success",
        message: "Ссылка отключена. Создайте новую при необходимости.",
      });
    } catch (err) {
      setStatus({
        state: "error",
        message: err?.response?.data?.detail || "Не удалось отключить ссылку",
      });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-window invite-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Пригласить участников</h3>
        <p className="invite-description">
          Участники получат доступ к рабочему пространству{" "}
          <strong>{workspace?.name || "без названия"}</strong> после перехода по
          ссылке.
        </p>

        <div className="invite-link-block">
          <h4>Ссылка-приглашение</h4>

          {invite ? (
            <div className="invite-link">
              <input
                type="text"
                readOnly
                value={invite.invite_url}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={loading}
              >
                Копировать
              </button>
              <button
                type="button"
                className="delete-link-btn"
                onClick={handleDeleteLink}
                disabled={loading}
                aria-label="Отключить ссылку"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              className="generate-link-btn"
              type="button"
              onClick={handleGenerateLink}
              disabled={loading || !workspace?.id}
            >
              {loading ? "Создаем..." : "Сгенерировать ссылку"}
            </button>
          )}
        </div>

        {status.message && (
          <div className={`invite-status-message ${status.state}`}>
            {status.message}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: "24px" }}>
          <button type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
