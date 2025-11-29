from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from api.models.workspace import WorkspaceWithRoleOut
from core.security import get_current_user
from db.database import get_db
from db.dbstruct import UserWorkspace

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

