from pydantic import BaseModel, Field

class ProjectCreate(BaseModel):
    title: str = Field(..., description="Название проекта")
    
class ProjectOut(BaseModel):
    id: int
    title: str = Field(..., description="Название проекта")
    workspaces_id: int = Field(..., description="ID рабочего пространства, к которому принадлежит проект")