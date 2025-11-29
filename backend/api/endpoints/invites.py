<<<<<<< HEAD
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from api.models.invite import (
    DirectInviteRequest,
    InviteAcceptResponse,
    InviteResponse,
)
from api.utils.workspaces import (
    can_manage_members,
    get_membership,
    resolve_membership,
)
from core.config import settings
from core.security import get_current_user
from db.database import get_db
from db.dbstruct import User, Workspace, WorkspaceInvite

router = APIRouter()


def _invite_url(token: str) -> str:
    base = settings.FRONTEND_URL.rstrip("/")
    return f"{base}/invite/{token}"


def _format_creator_name(invite: WorkspaceInvite) -> Optional[str]:
    creator = invite.creator
    if not creator:
        return None
    names = " ".join(
        part
        for part in [creator.first_name, creator.last_name]
        if part and part.strip()
    ).strip()
    if names:
        return names
    if creator.username:
        return creator.username
    return creator.email


def _serialize_invite(invite: WorkspaceInvite) -> InviteResponse:
    workspace_name = invite.workspace.name if invite.workspace else None
    return InviteResponse(
        token=invite.token,
        workspace_id=invite.workspace_id,
        workspace_name=workspace_name,
        creator_name=_format_creator_name(invite),
        created_at=invite.created_at,
        is_active=invite.is_active,
        used_count=invite.used_count or 0,
        invite_url=_invite_url(invite.token),
    )


@router.post("/api/invites", response_model=InviteResponse)
def create_invite_link(
    workspace_id: Optional[int] = Query(
        default=None, description="ID рабочего пространства"
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    membership = resolve_membership(db, current_user.id, workspace_id)
    if not can_manage_members(membership, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для генерации приглашений",
        )

    workspace = membership.workspace
    if not workspace:
        workspace = (
            db.query(Workspace)
            .filter(Workspace.id == membership.workspace_id)
            .first()
        )
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Рабочее пространство не найдено",
            )

    # деактивируем предыдущие ссылки
    (
        db.query(WorkspaceInvite)
        .filter(
            WorkspaceInvite.workspace_id == workspace.id,
            WorkspaceInvite.is_active.is_(True),
        )
        .update({"is_active": False})
    )
    db.flush()

    token = WorkspaceInvite.generate_token()
    while (
        db.query(WorkspaceInvite)
        .filter(WorkspaceInvite.token == token)
        .first()
        is not None
    ):
        token = WorkspaceInvite.generate_token()

    invite = WorkspaceInvite(
        workspace_id=workspace.id,
        token=token,
        created_by_id=current_user.id,
        is_active=True,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return _serialize_invite(invite)


@router.get("/api/invites/{token}", response_model=InviteResponse)
def get_invite_details(token: str, db: Session = Depends(get_db)):
    invite = (
        db.query(WorkspaceInvite)
        .options(joinedload(WorkspaceInvite.workspace), joinedload(WorkspaceInvite.creator))
        .filter(WorkspaceInvite.token == token)
        .first()
    )
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Приглашение не найдено",
        )
    return _serialize_invite(invite)


@router.get(
    "/api/invites/workspace/{workspace_id}",
    response_model=InviteResponse,
)
def get_active_invite_for_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    membership = get_membership(db, current_user.id, workspace_id)
    if not membership or not can_manage_members(membership, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к приглашениям этого пространства",
        )

    invite = (
        db.query(WorkspaceInvite)
        .options(joinedload(WorkspaceInvite.workspace), joinedload(WorkspaceInvite.creator))
        .filter(
            WorkspaceInvite.workspace_id == workspace_id,
            WorkspaceInvite.is_active.is_(True),
        )
        .order_by(WorkspaceInvite.created_at.desc())
        .first()
    )
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Активные приглашения не найдены",
        )
    return _serialize_invite(invite)


@router.delete("/api/invites/{token}")
def deactivate_invite(
    token: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invite = (
        db.query(WorkspaceInvite)
        .filter(WorkspaceInvite.token == token)
        .first()
    )
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Приглашение не найдено",
        )

    membership = get_membership(db, current_user.id, invite.workspace_id)
    if not membership and invite.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этому приглашению",
        )

    if not can_manage_members(membership, db) and invite.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для отключения ссылки",
        )

    invite.is_active = False
    db.add(invite)
    db.commit()
    return {"status": "deactivated", "token": token}


@router.post(
    "/api/invites/accept/{token}",
    response_model=InviteAcceptResponse,
)
def accept_invite(
    token: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invite = (
        db.query(WorkspaceInvite)
        .filter(WorkspaceInvite.token == token)
        .first()
    )
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Приглашение не найдено или устарело",
        )
    if not invite.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ссылка деактивирована владельцем",
        )

    existing_link = get_membership(db, current_user.id, invite.workspace_id)
    if existing_link:
        return InviteAcceptResponse(
            status="already_member",
            message="Вы уже состоите в этом рабочем пространстве",
            workspace_id=invite.workspace_id,
        )

    new_link = UserWorkspace(
        user_id=current_user.id,
        workspace_id=invite.workspace_id,
        role="member",
    )
    invite.used_count = (invite.used_count or 0) + 1
    db.add(new_link)
    db.add(invite)
    db.commit()
    return InviteAcceptResponse(
        status="joined",
        message="Вы успешно присоединились к рабочему пространству",
        workspace_id=invite.workspace_id,
    )


@router.post("/api/invites/send")
def send_workspace_invite(
    payload: DirectInviteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    membership = get_membership(db, current_user.id, payload.workspace_id)
    if not membership or not can_manage_members(membership, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к приглашению в это пространство",
        )

    target_user = db.query(User).filter(User.id == payload.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    existing_link = _get_membership(db, payload.user_id, payload.workspace_id)
    if existing_link:
        return {
            "status": "already_member",
            "workspace_id": payload.workspace_id,
        }

    new_link = UserWorkspace(
        user_id=payload.user_id,
        workspace_id=payload.workspace_id,
        role="member",
    )
    db.add(new_link)
    db.commit()
    return {
        "status": "added",
        "workspace_id": payload.workspace_id,
    }

=======
from typing import Union, Any
from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_user
from db.OrmQuery import OrmQuery
from api.models.invites import InviteCreate, InviteAccept, InviteAcceptMessage

router = APIRouter(tags=["✉️ Приглашения"])

@router.post("/api/invites/accept/{token}", response_model=Union[InviteAccept, InviteAcceptMessage])
def accept_invite(token: str, current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    res = OrmQuery.accept_invite(token, current_user.id)

    if not res:
        raise HTTPException(status_code=400, detail="Неверный или неактивный токен приглашения")

    if isinstance(res, dict):
        status = res.get("status")
        if status == "already_member":
            return {
                "status": "already_member",
                "message": "Вы уже в воркспейсе",
                "workspace_id": res.get("workspace_id"),
                "user_workspace_id": res.get("user_workspace_id"),
            }
        if status == "ok":
            link = res.get("link")
            return {
                "status": "ok",
                "workspace_id": getattr(link, "workspace_id", None),
                "user_workspace_id": getattr(link, "id", None),
            }

    try:
        return InviteAccept.from_orm(res)
    except Exception:
        return res

@router.post("/api/invites", response_model=InviteCreate)
def create_invite_endpoint(current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    invite = OrmQuery.create_invite(current_user.id)
    if not invite:
        raise HTTPException(status_code=400, detail="Workspace for user not found or invite not created")

    # Важно: вернуть Pydantic модель через from_orm чтобы корректно сериализовать ORM объект
    return InviteCreate.from_orm(invite)

@router.delete("/api/invites/{token}")
def delete_invite_endpoint(token: str, current_user=Depends(get_current_user)):
    """
    Удаляет (деактивирует) инвайт ссылку.
    Только владелец workspace может удалить инвайт.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    success = OrmQuery.delete_invite(token, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=403, 
            detail="Инвайт не найден или у вас нет прав на его удаление. Только владелец workspace может удалять инвайты."
        )

    return {"status": "ok", "message": "Инвайт успешно удален"}
>>>>>>> 98c7536ea8e95b34886d1db81d422b290cdc346f
