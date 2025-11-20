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