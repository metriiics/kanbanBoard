import React, { useState } from "react";
import { createPortal } from "react-dom";

export default function InviteModal({ onClose, workspace }) {
  const [link, setLink] = useState("");
  const [isLinkGenerated, setIsLinkGenerated] = useState(false);

  // Заглушка: генерация ссылки
  const handleGenerateLink = () => {
    const fakeLink = `https://yourapp.com/invite/${Math.random()
      .toString(36)
      .substring(2, 10)}`;
    setLink(fakeLink);
    setIsLinkGenerated(true);
  };

  // Удаление ссылки
  const handleDeleteLink = () => {
    setLink("");
    setIsLinkGenerated(false);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-window invite-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Пригласить участников</h3>
        <p className="invite-description">
          Ваши товарищи по команде получат доступ к вашему рабочему пространству
          после перехода по ссылке ниже.
        </p>

        <div className="invite-link-block">
          <h4>Создайте ссылку-приглашение</h4>

          {isLinkGenerated ? (
            <div className="invite-link">
              <input
                type="text"
                readOnly
                value={link}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(link)}
              >
                Копировать
              </button>
              <button
                type="button"
                className="delete-link-btn"
                onClick={handleDeleteLink}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              className="generate-link-btn"
              type="button"
              onClick={handleGenerateLink}
            >
              Сгенерировать ссылку
            </button>
          )}
        </div>

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
