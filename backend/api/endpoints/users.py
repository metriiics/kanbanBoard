<<<<<<< HEAD
from fastapi import APIRouter, HTTPException, Depends, Query
=======
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
>>>>>>> 98c7536ea8e95b34886d1db81d422b290cdc346f
from sqlalchemy.orm import Session
from db.database import session_factory, get_db
from db.OrmQuery import OrmQuery
from api.models.user import UserRead
from api.models.workspace import WorkspaceOut
from db.dbstruct import User 
from core.security import get_current_user
<<<<<<< HEAD
from api.utils.workspaces import resolve_membership
=======
from typing import Optional
>>>>>>> 98c7536ea8e95b34886d1db81d422b290cdc346f

router = APIRouter(tags=["👤 Пользователи"])
    
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
        "username": current_user.username,
        "avatar_url": current_user.avatar_url
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
def get_user_workspace(
    workspace_id: int | None = Query(
        default=None,
        description="ID рабочего пространства (опционально)",
    ),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = resolve_membership(db, current_user.id, workspace_id)
    workspace = membership.workspace
    if not workspace:
        raise HTTPException(status_code=404, detail="Рабочее пространство не найдено")
    return workspace

@router.put("/api/users/me")
def update_user_profile(
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    """
    Обновляет профиль текущего пользователя.
    Принимает данные как form-data для поддержки загрузки файла аватарки.
    
    Поля:
    - first_name: имя (опционально)
    - last_name: фамилия (опционально)
    - username: никнейм (опционально)
    - avatar: файл изображения (опционально, макс 5MB, форматы: JPEG, PNG, WebP)
    """
    
    # Проверяем, не занят ли никнейм
    if username and username != current_user.username:
        existing_user = OrmQuery.get_user_by_username(username)
        if existing_user:
            raise HTTPException(status_code=400, detail="Никнейм уже занят")
    
    # Обновляем пользователя (вся логика в OrmQuery)
    updated_user = OrmQuery.update_user(
        user_id=current_user.id,
        first_name=first_name,
        last_name=last_name,
        username=username,
        avatar_file=avatar
    )
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    return {
        "id": updated_user.id,
        "email": updated_user.email,
        "first_name": updated_user.first_name,
        "last_name": updated_user.last_name,
        "username": updated_user.username,
        "avatar_url": updated_user.avatar_url,
        "message": "Профиль успешно обновлен"
    }