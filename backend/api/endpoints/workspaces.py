from typing import List

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload

from api.models.workspace import WorkspaceWithRoleOut
from api.models.tasks import LabelOut, LabelCreate
from core.security import get_current_user
from db.database import get_db
from db.dbstruct import UserWorkspace, Label, User
from api.utils.workspaces import resolve_membership, get_membership
from db.OrmQuery import OrmQuery

router = APIRouter()


@router.get("/api/workspaces/my", response_model=List[WorkspaceWithRoleOut])
def list_user_workspaces(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    links = (
        db.query(UserWorkspace)
        .options(joinedload(UserWorkspace.workspace))
        .filter(UserWorkspace.user_id == current_user.id)
        .order_by(UserWorkspace.created_at.asc())
        .all()
    )

    items: List[WorkspaceWithRoleOut] = []
    for link in links:
        workspace = link.workspace
        if not workspace:
            continue
        
        # Находим владельца workspace (пользователя с ролью owner)
        owner_link = (
            db.query(UserWorkspace)
            .options(joinedload(UserWorkspace.user))
            .filter(
                UserWorkspace.workspace_id == workspace.id,
                UserWorkspace.role.ilike("owner")
            )
            .first()
        )
        owner_username = owner_link.user.username if owner_link and owner_link.user else None
        
        items.append(
            WorkspaceWithRoleOut(
                id=workspace.id,
                name=workspace.name,
                description=workspace.description,
                created_at=workspace.created_at,
                role=link.role,
                can_invite_users=link.can_invite_users,
                can_create_projects=link.can_create_projects,
                is_personal=link.role.lower() == "owner",
                owner_username=owner_username,
            )
        )
    return items


@router.get("/api/workspace/labels", response_model=List[LabelOut])
def list_workspace_labels(
    workspace_id: int | None = Query(
        default=None,
        description="ID рабочего пространства (опционально)",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    membership = resolve_membership(db, current_user.id, workspace_id)

    labels = (
        db.query(Label)
        .filter(Label.workspace_id == membership.workspace_id)
        .order_by(Label.name.asc())
        .all()
    )

    return [
        LabelOut(
            id=label.id,
            name=getattr(label, "name", None),
            color=getattr(label, "color", None),
        )
        for label in labels
    ]

@router.post("/api/workspace/labels", response_model=LabelOut)
def create_workspace_label(
    payload: LabelCreate,
    workspace_id: int | None = Query(
        default=None,
        description="ID рабочего пространства (опционально)",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Создаёт новый тег в рабочем пространстве.
    """
    membership = resolve_membership(db, current_user.id, workspace_id)
    
    label = OrmQuery.create_label(
        workspace_id=membership.workspace_id,
        name=payload.name,
        color=payload.color
    )
    
    if not label:
        raise HTTPException(status_code=404, detail="Рабочее пространство не найдено")
    
    return LabelOut(
        id=label.id,
        name=getattr(label, "name", None),
        color=getattr(label, "color", None),
    )


@router.get("/api/workspace/by-username/{username}", response_model=WorkspaceWithRoleOut)
def get_workspace_by_username(
    username: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Возвращает workspace пользователя по его username.
    Проверяет доступ текущего пользователя к этому workspace.
    """
    # Находим пользователя по username
    target_user = OrmQuery.get_user_by_username(username)
    if not target_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Находим персональное workspace пользователя (где он owner)
    target_membership = (
        db.query(UserWorkspace)
        .options(joinedload(UserWorkspace.workspace))
        .filter(
            UserWorkspace.user_id == target_user.id,
            UserWorkspace.role.ilike("owner")
        )
        .first()
    )
    
    if not target_membership or not target_membership.workspace:
        raise HTTPException(status_code=404, detail="Рабочее пространство не найдено")
    
    workspace_id = target_membership.workspace_id
    
    # Проверяем, может ли текущий пользователь получить доступ к этому workspace
    current_membership = get_membership(db, current_user.id, workspace_id)
    if not current_membership:
        raise HTTPException(
            status_code=403,
            detail="Рабочее пространство недоступно"
        )
    
    workspace = target_membership.workspace
    
    # Возвращаем workspace с информацией о роли текущего пользователя
    return WorkspaceWithRoleOut(
        id=workspace.id,
        name=getattr(workspace, "name", None),
        description=getattr(workspace, "description", None),
        created_at=getattr(workspace, "created_at", None),
        role=current_membership.role,
        can_invite_users=current_membership.can_invite_users,
        can_create_projects=current_membership.can_create_projects,
        is_personal=current_membership.role.lower() == "owner",
        owner_username=target_user.username,
    )

