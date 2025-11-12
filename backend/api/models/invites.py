from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime

class InviteCreate(BaseModel):
    id: int
    workspace_id: int
    token: str
    created_by_id: int
    created_at: datetime
    is_active: bool
    used_count: int

    model_config = ConfigDict(from_attributes=True)


class InviteAccept(BaseModel):
    id: int
    role: str
    workspace_id: str
    created_by_id: int

    model_config = ConfigDict(from_attributes=True)

class InviteAcceptMessage(BaseModel):
    status: str
    message: Optional[str] = None
    workspace_id: Optional[Any] = None
    user_workspace_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)