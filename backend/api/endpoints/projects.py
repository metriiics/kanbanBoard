from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.OrmQuery import OrmQuery
from api.models.projects import (
    ProjectWithBoardsOut,
    ProjectCreate,
    ProjectOut,
    ProjectUpdateTitle,
    ProjectUserAccessCreate,
    ProjectGetUsersAccess,
    ProjectUserAccessOut,
)
from api.utils.workspaces import resolve_membership
from api.utils.permissions import get_user_accessible_projects, can_view_project, can_edit_project
from db.database import get_db

router = APIRouter(tags=["📁 Проекты"])

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
    Фильтрует проекты по доступу пользователя (роль и UserProjectAccess).
    Владелец получает все проекты, остальные - только те, к которым есть доступ.
    """
    
    membership = resolve_membership(db, current_user.id, workspace_id)
    # Получаем только доступные проекты
    projects = get_user_accessible_projects(current_user.id, membership.workspace_id, db)
    return projects or []

@router.post("/api/projects/create", response_model=ProjectOut)
def create_project_endpoint(
    project: ProjectCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = resolve_membership(db, current_user.id, project.workspaces_id)
    
    # Только владелец может создавать проекты
    if not membership.can_create_projects and membership.role.lower() != "owner":
        raise HTTPException(
            status_code=403,
            detail="Только владелец рабочего пространства может создавать проекты"
        )

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

    # Проверяем доступ к проекту
    if not can_view_project(current_user.id, project_id, db):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")
    
    # Проверяем право на редактирование (только владелец)
    if not can_edit_project(current_user.id, project_id, db):
        raise HTTPException(status_code=403, detail="Только владелец может редактировать проекты")

    updated_project = OrmQuery.update_project_title(project_id, project_update.title)
    return updated_project

@router.post("/api/projects/access/create", response_model=ProjectUserAccessOut)
def create_project_user_access(
    access: ProjectUserAccessCreate,
    current_user=Depends(get_current_user)
):
    project = OrmQuery.get_project_by_id(access.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    workspace = OrmQuery.get_workspace_by_user_id(current_user.id)
    if not workspace or workspace.id != project.workspaces_id:
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")

    new_access = OrmQuery.create_user_project_access(
        project_id=access.project_id,
        user_id=access.user_id,
        can_edit=access.can_edit,
        can_view=access.can_view
    )
    if not new_access:
        raise HTTPException(status_code=400, detail="Не удалось создать доступ (проект или пользователь не найдены)")

    return new_access

@router.get("/api/projects/{project_id}/access", response_model=List[ProjectGetUsersAccess])
def get_project_users_access(
    project_id: int,
    current_user=Depends(get_current_user)
):
    project = OrmQuery.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    workspace = OrmQuery.get_workspace_by_user_id(current_user.id)
    if not workspace or workspace.id != project.workspaces_id:
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")

    access_list = OrmQuery.get_users_project_access(project_id) or []
    # Преобразуем ORM-объекты в dict, чтобы соответствовать ProjectGetUsersAccess
    result = [
        {
            "user_id": a.user_id,
            "project_id": a.project_id,
            "can_edit": getattr(a, "can_edit", False),
            "can_view": getattr(a, "can_view", False),
            "created_at": getattr(a, "created_at", None),
        }
        for a in access_list
    ]
    return result

@router.delete("/api/projects/{project_id}")
def delete_project(
    project_id: int,
    current_user=Depends(get_current_user)
):
    """
    Удаляет проект вместе со всеми связанными сущностями.
    Только владелец workspace может удалить проект.
    """
    project = OrmQuery.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    # Проверяем, что пользователь является владельцем workspace
    user_role = OrmQuery.get_user_workspace_role(current_user.id, project.workspaces_id)
    if user_role != "owner":
        raise HTTPException(
            status_code=403, 
            detail="Только владелец рабочего пространства может удалять проекты"
        )

    # Удаляем проект со всеми связанными сущностями
    success = OrmQuery.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=500, detail="Не удалось удалить проект")

    return {"status": "ok", "message": "Проект успешно удален"}