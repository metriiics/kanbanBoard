from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db.database import session_factory, get_db
from db.OrmQuery import OrmQuery
from api.models.user import UserRead
from api.models.workspace import WorkspaceOut
from db.dbstruct import User 
from core.security import get_current_user

router = APIRouter()
    
@router.get("/api/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):

    """
    Возвращает информацию о текущем пользователе.
    """

    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "username": current_user.username
    }  

@router.get("/api/users/{user_id}", response_model=UserRead)
def get_user_endpoint(user_id: int):

    """
    Возвращает информацию о пользователе по его ID.
    """

    db_user = OrmQuery.get_user_by_id(user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return UserRead.model_validate(db_user)


@router.get("/api/workspace/me", response_model=WorkspaceOut)
def get_user_workspace(current_user = Depends(get_current_user)):
    workspace = OrmQuery.get_workspace_by_user_id(current_user.id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Рабочее пространство не найдено")
    return workspace