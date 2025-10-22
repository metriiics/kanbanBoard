from fastapi import APIRouter, HTTPException, Depends
from typing import List

from core.security import get_current_user
from db.OrmQuery import OrmQuery
from api.models.projects import ProjectWithBoardsOut

router = APIRouter()

@router.get("/users/{user_id}/projects", response_model=List[ProjectWithBoardsOut])
def get_user_projects(user_id: int, current_user = Depends(get_current_user)):
    # текущая реализация security возвращает объект пользователя из БД
    current_user_id = getattr(current_user, "id", None)
    if current_user_id is None:
        raise HTTPException(status_code=401, detail="Невалидные учетные данные")

    # разрешаем доступ только владельцу (тут можно расширить логику для ролей/админов)
    if current_user_id != user_id:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    projects = OrmQuery.get_projects_by_user_id(user_id) or []
    return projects