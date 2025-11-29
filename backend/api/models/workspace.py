from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class WorkspaceOut(BaseModel):
    id: int = Field(...)
    name: Optional[str] = Field(None)
    description: Optional[str] = Field(None)
    created_at: Optional[datetime] = Field(None)

    class Config:
        from_attributes = True


class WorkspaceWithRoleOut(WorkspaceOut):
    role: str = Field(..., description="Роль текущего пользователя в пространстве")
    can_invite_users: bool = Field(default=False)
    can_create_projects: bool = Field(default=False)
    is_personal: bool = Field(default=False, description="Является ли это личное пространство пользователя")

