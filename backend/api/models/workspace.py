from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class WorkspaceOut(BaseModel):
    id: int = Field(...)
    name: Optional[str] = Field(None)
    description: Optional[str] = Field(None)
    created_at: Optional[datetime] = Field(None)

