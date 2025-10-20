from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_user
from api.models.projects import ProjectCreate, ProjectOut
from db.OrmQuery import OrmQuery

router = APIRouter()

from fastapi import APIRouter, Depends, HTTPException
from api.models.projects import ProjectCreate, ProjectOut
from db.OrmQuery import OrmQuery
from core.security import get_current_user

router = APIRouter()

@router.post("/workspaces/{workspace_id}/create_project", response_model=ProjectOut)
def create_project(
    workspace_id: int,
    project: ProjectCreate,
    current_user=Depends(get_current_user)
):
    # Проверим, что workspace принадлежит текущему пользователю
    workspace = OrmQuery.get_workspace_for_user(current_user.id, workspace_id)
    if not workspace:
        raise HTTPException(status_code=403, detail="Нет доступа к этому рабочему пространству")

    # Создание проекта
    new_project = OrmQuery.create_project(
    title=project.title,
    workspaces_id=workspace_id
    )

    return new_project


@router.get("/workspaces/{workspace_id}/projects", response_model=list[ProjectOut])
def get_projects(workspace_id: int, current_user=Depends(get_current_user)):
    projects = OrmQuery.get_projects_for_workspace(current_user.id, workspace_id)
    if not projects:
        raise HTTPException(status_code=404, detail="Проекты не найдены или нет доступа")
    return projects