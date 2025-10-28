from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BoardOut(BaseModel):
    id: int
    title: Optional[str] = Field(None, description="Название доски")
    projects_id: int = Field(..., description="ID проекта")
    created_at: Optional[datetime] = Field(None, description="Дата создания")

class BoardCreate(BaseModel):
    title: str = Field(...)
    projects_id: int = Field(...)