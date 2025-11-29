from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ColorOut(BaseModel):
    id: int
    name: str
    hex_code: str

class TaskOut(BaseModel):
    id: int
    title: Optional[str] = None
    description: Optional[str] = None
    board_id: Optional[int] = None
    column_id: Optional[int] = None
    created_at: Optional[datetime] = None

class ColumnWithTasksOut(BaseModel):
    id: int
    title: Optional[str] = None
    board_id: int
    color: Optional[ColorOut] = None 
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

class TaskFilledFieldsOut(BaseModel):
    task_id: int
    filled_fields: Dict[str, Any] = Field(default_factory=dict, description="Заполненные поля задачи: имя поля -> значение")

class LabelOut(BaseModel):
    id: int
    name: Optional[str] = None
    color: Optional[str] = None

class AssigneeOut(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None

class TaskCardOut(BaseModel):
    id: int
    title: Optional[str] = None
    labels: List[LabelOut] = Field(default_factory=list)
    assignee: Optional[AssigneeOut] = None

class ColumnOut(BaseModel):
    id: int
    title: Optional[str] = None
    board_id: Optional[int] = None

class TaskCommentOut(BaseModel):
    id: int
    content: Optional[str] = None
    user: Optional[AssigneeOut] = None
    created_at: Optional[datetime] = None

class TaskDetailOut(BaseModel):
    id: int
    title: Optional[str] = None
    description: Optional[str] = None
    common_id: Optional[int] = None
    priority: Optional[str] = None
    created_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    column: Optional[ColumnOut] = None
    labels: List[LabelOut] = Field(default_factory=list)
    assignee: Optional[AssigneeOut] = None
    comments: List[TaskCommentOut] = Field(default_factory=list)

class TaskCreate(BaseModel):
    title: str
    column_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    common_id: Optional[int] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    column_id: Optional[int] = None
    assigned_to: Optional[int] = None
    label_ids: Optional[List[int]] = None

class CommentCreate(BaseModel):
    content: str

class LabelCreate(BaseModel):
    name: str
    color: Optional[str] = None