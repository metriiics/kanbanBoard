from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from api.models.boards import BoardOut

class ProjectOut(BaseModel):
    id: int
    title: Optional[str] = Field(None, description="Название проекта")
    workspaces_id: int = Field(..., description="ID рабочего пространства, к которому принадлежит проект")
    created_at: Optional[datetime] = Field(None, description="Дата создания")

class ProjectWithBoardsOut(ProjectOut):
    boards: List[BoardOut] = Field(default_factory=list, description="Список досок проекта")

class ProjectCreate(BaseModel):
    title: str = Field(..., description="Название проекта")
    workspaces_id: int = Field(..., description="ID рабочего пространства, в котором создаётся проект")

