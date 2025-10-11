from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.models.user import UserLogin
from db.OrmQuery import OrmQuery
from db.database import get_db
from core.security import create_access_token
from core.security import verify_password
from api.models.user import UserCreate, UserRead
from db.dbstruct import User

router = APIRouter()

@router.post("/api/auth/register", response_model=UserRead) # Создание нового пользователя
def create_user_endpoint(user: UserCreate):
    db_user = OrmQuery.get_user_by_email(email=user.email) # Проверка, что пользователь с таким email не существует
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = OrmQuery.create_user(user=user)
    return UserRead.model_validate(new_user)

@router.post("/api/auth/login") # Вход пользователя и получение JWT токена
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = OrmQuery.get_user_by_email(email=user.email)
    if not db_user or not verify_password(user.password, db_user.password): # Проверка email и пароля
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}