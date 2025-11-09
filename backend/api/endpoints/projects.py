from fastapi import APIRouter, HTTPException, Depends
from typing import List

from core.security import get_current_user
from db.OrmQuery import OrmQuery
from api.models.projects import ProjectWithBoardsOut, ProjectCreate, ProjectOut, ProjectUpdateTitle

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

@router.post("/api/projects/create", response_model=ProjectOut)
def create_project_endpoint(
    project: ProjectCreate,
    current_user=Depends(get_current_user)
):
    workspace = OrmQuery.get_workspace_by_user_id(current_user.id)
    if not workspace or workspace.id != project.workspaces_id:
        raise HTTPException(status_code=403, detail="Нет доступа к рабочему пространству")

    new_project = OrmQuery.create_project(project)
    return new_project

@router.put("/api/projects/{project_id}/title", response_model=ProjectOut)
def update_project_title(
    project_id: int,
    project_update: ProjectUpdateTitle,
    current_user=Depends(get_current_user)
):
    project = OrmQuery.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    workspace = OrmQuery.get_workspace_by_user_id(current_user.id)
    if not workspace or workspace.id != project.workspaces_id:
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")

    updated_project = OrmQuery.update_project_title(project_id, project_update.title)
    return updated_project