from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_user
from db.OrmQuery import OrmQuery

router = APIRouter()

@router.post("/api/invites/accept/{token}")
def accept_invite(token: str, current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    res = OrmQuery.accept_invite(token, current_user.id)

    if not res:
        raise HTTPException(status_code=400, detail="Неверный или неактивный токен приглашения")

    # OrmQuery может вернуть dict с статусом или сам объект UserWorkspace
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
            return {"status": "ok", "workspace_id": link.workspace_id, "user_workspace_id": link.id}

    # Если вернулся объект UserWorkspace
    return {"status": "ok", "workspace_id": res.workspace_id, "user_workspace_id": res.id}