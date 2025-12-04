from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class WorkspaceMemberOut(BaseModel):
    workspace_link_id: int = Field(..., description="ID записи user_workspaces")
    workspace_id: int = Field(..., description="ID рабочего пространства")
    user_id: int = Field(..., description="ID пользователя")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = Field(..., description="Роль пользователя в пространстве")
    can_create_projects: bool = Field(default=False)
    can_invite_users: bool = Field(default=False)
    joined_at: datetime = Field(..., description="Дата присоединения")
    accessible_project_ids: List[int] = Field(default_factory=list, description="ID проектов, к которым есть доступ")


class MemberRoleUpdate(BaseModel):
    role: str = Field(..., description="Роль: reader, commenter, participant, owner")


class MemberProjectsUpdate(BaseModel):
    project_ids: List[int] = Field(default_factory=list, description="Список ID проектов для доступа")

