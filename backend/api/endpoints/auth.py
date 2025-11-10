from fastapi import APIRouter, Depends, HTTPException
from core.avatar_generator import generate_avatar
from sqlalchemy.orm import Session
from api.models.user import UserLogin
from db.OrmQuery import OrmQuery
from db.database import get_db
from core.security import create_access_token
from core.security import verify_password
from api.models.user import UserCreate, UserRead
from db.dbstruct import User

router = APIRouter()

@router.post("/api/auth/register", response_model=UserRead)
def create_user_endpoint(user: UserCreate):

    '''
    Регистрация нового пользователя
    '''

    db_user = OrmQuery.get_user_by_email(email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Имя пользователя или email уже заняты")
    
    avatar_path = generate_avatar(user.first_name, user.last_name)
    avatar_url = f"http://localhost:8000/{avatar_path}"

    new_user = OrmQuery.create_user(user=user, avatar_url=avatar_url)
    return UserRead.model_validate(new_user)

@router.post("/api/auth/login")
def login(user: UserLogin):

    '''
    Аутентификация пользователя и получение токена
    '''

    db_user = OrmQuery.get_user_by_email(email=user.email)
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Неверные учетные данные")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}
