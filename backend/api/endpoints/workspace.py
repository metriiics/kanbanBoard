from fastapi import APIRouter, HTTPException
from api.models.workspace import WorkspaceCreate, WorkspaceOut
from db.OrmQuery import OrmQuery

from core.security import get_current_user
from fastapi import Depends

router = APIRouter()

@router.post("/{user_id}/workspace_create", response_model=WorkspaceOut) # Создание рабочего пространства для пользователя
def create_workspace(workspace: WorkspaceCreate,
    current_user = Depends(get_current_user)
):
    new_workspace = OrmQuery.create_workspace_for_user(
        user_id=current_user.id,
        name=workspace.name,
        description=workspace.description
    )
    return new_workspace

@router.get("/workspaces/{workspace_id}", response_model=WorkspaceOut)
def get_workspace(
    workspace_id: int,
    current_user=Depends(get_current_user)
):
    workspace = OrmQuery.get_workspace_for_user(current_user.id, workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=404, 
            detail="Рабочее пространство не найдено или нет доступа"
        )
    return workspace

