from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class InviteResponse(BaseModel):
    token: str = Field(..., description="Уникальный токен приглашения")
    workspace_id: int = Field(..., description="ID рабочего пространства")
    workspace_name: Optional[str] = Field(None, description="Название рабочего пространства")
    creator_name: Optional[str] = Field(None, description="Имя создателя приглашения")
    created_at: datetime = Field(..., description="Дата и время создания приглашения")
    is_active: bool = Field(..., description="Флаг активности ссылки")
    used_count: int = Field(..., description="Количество использований ссылки")
    invite_url: str = Field(..., description="Полная ссылка-приглашение")


class InviteAcceptResponse(BaseModel):
    status: str = Field(..., description="Статус обработки приглашения")
    message: str = Field(..., description="Сообщение для пользователя")
    workspace_id: int = Field(..., description="ID рабочего пространства")


class DirectInviteRequest(BaseModel):
    workspace_id: int = Field(..., description="ID рабочего пространства")
    user_id: int = Field(..., description="ID пользователя, которого добавляем")

