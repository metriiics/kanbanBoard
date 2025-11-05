from fastapi import APIRouter, HTTPException, Depends
from typing import List

from core.security import get_current_user
from db.OrmQuery import OrmQuery
from api.models.projects import ProjectWithBoardsOut

router = APIRouter()

@router.get("/api/workspace/projects", response_model=List[ProjectWithBoardsOut])
def get_workspace_projects(
        current_user = Depends(get_current_user)
    ):

    """
    Возвращает проекты текущего пользователя по его workspace_id.
    workspace_id берётся из связанной таблицы user_workspaces.
    """
    
    current_user_id = getattr(current_user, "id", None)
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Невалидные учетные данные")

    workspace = OrmQuery.get_workspace_by_user_id(current_user_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Рабочее пространство не найдено")

    projects = OrmQuery.get_projects_by_workspace_id(workspace.id)
    return projects or []
