from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserLogin
from app.crud.user import get_user_by_email, create_user
from app.db.database import get_db
from app.core.security import create_access_token
from app.core.security import verify_password
from app.schemas.user import UserCreate, UserRead
from app.models.user import User

router = APIRouter()

@router.post("/auth/register", response_model=UserRead) # Создание нового пользователя
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email) # Проверка, что пользователь с таким email не существует
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = create_user(db=db, user=user)
    return UserRead.model_validate(new_user)

@router.post("/auth/login") # Вход пользователя и получение JWT токена
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if not db_user or not verify_password(user.password, db_user.password): # Проверка email и пароля
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}