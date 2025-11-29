from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.OrmQuery import OrmQuery
from api.models.projects import ProjectWithBoardsOut, ProjectCreate, ProjectOut, ProjectUpdateTitle
from api.utils.workspaces import resolve_membership
from db.database import get_db

router = APIRouter()

@router.get("/api/workspace/projects", response_model=List[ProjectWithBoardsOut])
def get_workspace_projects(
        workspace_id: int | None = Query(
            default=None,
            description="ID рабочего пространства (опционально)",
        ),
        current_user = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):

    """
    Возвращает проекты текущего пользователя по его workspace_id.
    workspace_id берётся из связанной таблицы user_workspaces.
    """
    
    membership = resolve_membership(db, current_user.id, workspace_id)
    projects = OrmQuery.get_projects_by_workspace_id(membership.workspace_id)
    return projects or []

@router.post("/api/projects/create", response_model=ProjectOut)
def create_project_endpoint(
    project: ProjectCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resolve_membership(db, current_user.id, project.workspaces_id)

    new_project = OrmQuery.create_project(project)
    return new_project

@router.put("/api/projects/{project_id}/title", response_model=ProjectOut)
def update_project_title(
    project_id: int,
    project_update: ProjectUpdateTitle,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = OrmQuery.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    resolve_membership(db, current_user.id, project.workspaces_id)

    updated_project = OrmQuery.update_project_title(project_id, project_update.title)
    return updated_project