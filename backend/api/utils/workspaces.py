from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from db.dbstruct import UserWorkspace

MANAGER_ROLES = {"owner", "admin"}


def get_membership(
    db: Session,
    user_id: int,
    workspace_id: int,
) -> Optional[UserWorkspace]:
    return (
        db.query(UserWorkspace)
        .options(joinedload(UserWorkspace.workspace))
        .filter(
            UserWorkspace.user_id == user_id,
            UserWorkspace.workspace_id == workspace_id,
        )
        .first()
    )


def resolve_membership(
    db: Session,
    user_id: int,
    workspace_id: Optional[int] = None,
) -> UserWorkspace:
    query = (
        db.query(UserWorkspace)
        .options(joinedload(UserWorkspace.workspace))
        .filter(UserWorkspace.user_id == user_id)
    )
    if workspace_id is not None:
        query = query.filter(UserWorkspace.workspace_id == workspace_id)

    membership = query.first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Рабочее пространство недоступно",
        )
    return membership


def can_manage_members(
    link: Optional[UserWorkspace],
    db: Optional[Session] = None,
) -> bool:
    if not link:
        return False
    role = (link.role or "").lower()
    if role in MANAGER_ROLES or link.can_invite_users:
        return True
    if not db:
        return False
    members_count = (
        db.query(UserWorkspace)
        .filter(UserWorkspace.workspace_id == link.workspace_id)
        .count()
    )
    return members_count <= 1

