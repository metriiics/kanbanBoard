from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from api.models.members import WorkspaceMemberOut, MemberRoleUpdate, MemberProjectsUpdate
from api.utils.workspaces import can_manage_members, get_membership, resolve_membership
from core.security import get_current_user
from db.database import get_db
from db.dbstruct import UserWorkspace
from db.OrmQuery import OrmQuery

router = APIRouter()


@router.get("/api/workspace/members", response_model=List[WorkspaceMemberOut])
def list_workspace_members(
    workspace_id: int | None = Query(
        default=None,
        description="ID рабочего пространства (опционально)",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    membership = resolve_membership(db, current_user.id, workspace_id)
    links = (
        db.query(UserWorkspace)
        .options(joinedload(UserWorkspace.user))
        .filter(UserWorkspace.workspace_id == membership.workspace_id)
        .order_by(UserWorkspace.created_at.asc())
        .all()
    )

    members: List[WorkspaceMemberOut] = []
    for link in links:
        user = link.user
        # Получаем список проектов, к которым у пользователя есть доступ
        accessible_project_ids = OrmQuery.get_user_project_accesses(link.user_id, membership.workspace_id)
        members.append(
            WorkspaceMemberOut(
                workspace_link_id=link.id,
                workspace_id=link.workspace_id,
                user_id=link.user_id,
                first_name=getattr(user, "first_name", None),
                last_name=getattr(user, "last_name", None),
                username=getattr(user, "username", None),
                email=getattr(user, "email", None),
                avatar_url=getattr(user, "avatar_url", None),
                role=link.role,
                can_create_projects=link.can_create_projects,
                can_invite_users=link.can_invite_users,
                joined_at=link.created_at,
                accessible_project_ids=accessible_project_ids,
            )
        )
    return members


@router.delete("/api/workspace/members/{user_id}")
def remove_workspace_member(
    user_id: int,
    workspace_id: int | None = Query(
        default=None,
        description="ID рабочего пространства (опционально)",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    membership = resolve_membership(db, current_user.id, workspace_id)

    if membership.user_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить самого себя",
        )

    target_link = (
        db.query(UserWorkspace)
        .filter(
            UserWorkspace.user_id == user_id,
            UserWorkspace.workspace_id == membership.workspace_id,
        )
        .first()
    )

    if not target_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден в этом рабочем пространстве",
        )

    if target_link.role.lower() == "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нельзя удалить владельца рабочего пространства",
        )

    if not can_manage_members(membership, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления участника",
        )

    db.delete(target_link)
    db.commit()

    return {"status": "removed", "user_id": user_id}


@router.put("/api/workspace/members/{user_id}/role")
def update_member_role(
    user_id: int,
    role_update: MemberRoleUpdate,
    workspace_id: int | None = Query(
        default=None,
        description="ID рабочего пространства (опционально)",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Обновляет роль участника рабочего пространства.
    Доступные роли: reader, commenter, participant, owner
    """
    membership = resolve_membership(db, current_user.id, workspace_id)
    
    # Проверяем права на управление участниками
    if not can_manage_members(membership, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для изменения роли участника",
        )
    
    # Проверяем, что роль валидна
    valid_roles = {"reader", "commenter", "participant", "owner"}
    if role_update.role.lower() not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимая роль. Доступные роли: {', '.join(valid_roles)}",
        )
    
    # Нельзя изменить роль владельца
    target_link = (
        db.query(UserWorkspace)
        .filter(
            UserWorkspace.user_id == user_id,
            UserWorkspace.workspace_id == membership.workspace_id,
        )
        .first()
    )
    
    if not target_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден в этом рабочем пространстве",
        )
    
    if target_link.role.lower() == "owner" and role_update.role.lower() != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нельзя изменить роль владельца рабочего пространства",
        )
    
    # Обновляем роль
    success = OrmQuery.update_user_workspace_role(
        user_id, membership.workspace_id, role_update.role.lower()
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось обновить роль",
        )
    
    return {"status": "updated", "user_id": user_id, "role": role_update.role.lower()}


@router.put("/api/workspace/members/{user_id}/projects")
def update_member_projects(
    user_id: int,
    projects_update: MemberProjectsUpdate,
    workspace_id: int | None = Query(
        default=None,
        description="ID рабочего пространства (опционально)",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Обновляет список проектов, к которым у участника есть доступ.
    """
    membership = resolve_membership(db, current_user.id, workspace_id)
    
    # Проверяем права на управление участниками
    if not can_manage_members(membership, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для изменения доступа к проектам",
        )
    
    # Проверяем, что пользователь является участником workspace
    target_link = (
        db.query(UserWorkspace)
        .filter(
            UserWorkspace.user_id == user_id,
            UserWorkspace.workspace_id == membership.workspace_id,
        )
        .first()
    )
    
    if not target_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден в этом рабочем пространстве",
        )
    
    # Обновляем доступы к проектам
    success = OrmQuery.update_user_project_accesses(
        user_id, membership.workspace_id, projects_update.project_ids
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось обновить доступ к проектам",
        )
    
    return {
        "status": "updated",
        "user_id": user_id,
        "project_ids": projects_update.project_ids,
    }

