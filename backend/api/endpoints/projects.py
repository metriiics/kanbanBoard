from fastapi import APIRouter, HTTPException, Depends
from typing import List

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

router = APIRouter(tags=["📁 Проекты"])

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