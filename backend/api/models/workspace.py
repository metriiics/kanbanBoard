from pydantic import BaseModel, Field

class WorkspaceCreate(BaseModel):
    name: str = Field(..., description="Название рабочего пространства")
    description: str | None = Field(None, description="Описание рабочего пространства")

class WorkspaceOut(BaseModel): 
    id: int
    name: str = Field(..., description="Название рабочего пространства")
    description: str | None = Field(None, description="Описание рабочего пространства")