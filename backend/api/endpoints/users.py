from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.api.models.user import UserCreate, UserResponse
from app.core.security import get_password_hash, create_access_token, get_user_by_token, verify_password
from app.db.database import session_factory
from app.db.dbstruct import UserOrm
from app.db.OrmQuery import OrmQuery

router = APIRouter()

@router.post("/register/")
def create_user(user: UserCreate): 
    OrmQuery.insert_data(
        username=user.username, 
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    return {"message": "The user has been successfully registered!"}

@router.post("/login/")
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = OrmQuery.select_users(form_data.username)
    if not user or not verify_password(form_data.password, user[0].hashed_password): 
        raise HTTPException(
            status_code=401, 
            detail="Invalid credentials", 
            headers={"WWW-Authenticate": "Bearer"}
        )
    jwt_token = create_access_token({"sub": form_data.username})
    return {"access_token": jwt_token, "token_type": "bearer"}