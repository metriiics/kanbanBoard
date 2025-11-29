from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from api.models.workspace import WorkspaceWithRoleOut
from api.models.tasks import LabelOut, LabelCreate
from core.security import get_current_user
from db.database import get_db
from db.dbstruct import UserWorkspace, Label
from api.utils.workspaces import resolve_membership
from db.OrmQuery import OrmQuery
from fastapi import HTTPException

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

