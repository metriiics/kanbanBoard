from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import UserRead
from app.crud.user import get_user_by_id
from app.models.user import User 
from app.core.security import get_current_user

router = APIRouter()
    
@router.get("/users/me") # Получение информации о текущем пользователе (защищенная ручка для проверки токена) - работает
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email
    }  

@router.get("/users/{user_id}", response_model=UserRead) # Получение информации о пользователе по ID
def get_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserRead.model_validate(db_user)

   