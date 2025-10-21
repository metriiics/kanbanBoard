from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db.database import session_factory, get_db
from db.OrmQuery import OrmQuery
from api.models.user import UserRead
from db.dbstruct import User 
from core.security import get_current_user

router = APIRouter()
    
@router.get("/api/users/me") # Получение информации о текущем пользователе (защищенная ручка для проверки токена) - работает
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "username": current_user.username
    }  

@router.get("/api/users/{user_id}", response_model=UserRead) # Получение информации о пользователе по ID
def get_user_endpoint(user_id: int):
    db_user = OrmQuery.get_user_by_id(user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return UserRead.model_validate(db_user)

   