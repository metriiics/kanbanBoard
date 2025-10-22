from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TaskOut(BaseModel):
    id: int
    title: Optional[str] = None
    description: Optional[str] = None
    board_id: Optional[int] = None   # was boards_id
    column_id: Optional[int] = None  # new: column reference
    created_at: Optional[datetime] = None

class ColumnWithTasksOut(BaseModel):
    id: int
    title: Optional[str] = None
    board_id: int                       # was boards_id
    tasks: List[TaskOut] = Field(default_factory=list)

class ProjectInfo(BaseModel):
    id: int
    title: Optional[str] = None
    workspaces_id: Optional[int] = None


class BoardTasksOut(BaseModel):
    board_id: int
    board_title: Optional[str] = None
    project: Optional[ProjectInfo] = None
    columns: List[ColumnWithTasksOut] = Field(default_factory=list)
