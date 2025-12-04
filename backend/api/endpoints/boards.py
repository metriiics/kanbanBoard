from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from db.OrmQuery import OrmQuery
from api.models.boards import BoardCreate, BoardOut, BoardUpdateTitle
from core.security import get_current_user
from api.utils.permissions import can_view_project, can_edit_project
from db.database import get_db

router = APIRouter(tags=["📋 Доски"])

@router.post("/api/boards/create", response_model=BoardOut)
def create_board_endpoint(
    board: BoardCreate, 
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создает доску и автоматически добавляет стандартные колонки.
    Только владелец может создавать доски.
    """
    project = OrmQuery.get_project_by_id(board.projects_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    # Проверяем доступ к проекту
    if not can_view_project(current_user.id, board.projects_id, db):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")
    
    # Только владелец может создавать доски
    if not can_edit_project(current_user.id, board.projects_id, db):
        raise HTTPException(status_code=403, detail="Только владелец может создавать доски")

    new_board = OrmQuery.create_board(board)
    return new_board

@router.put("/api/boards/{board_id}/title", response_model=BoardOut)
def update_board_title(
    board_id: int, 
    board_update: BoardUpdateTitle, 
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Обновляет название доски по её ID.
    Только владелец может редактировать доски.
    """
    board = OrmQuery.get_board_by_id(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    
    # Проверяем доступ к проекту
    if not can_view_project(current_user.id, board.projects_id, db):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")
    
    # Только владелец может редактировать доски
    if not can_edit_project(current_user.id, board.projects_id, db):
        raise HTTPException(status_code=403, detail="Только владелец может редактировать доски")

    updated_board = OrmQuery.update_board_title(board_id, board_update.title)
    return updated_board

@router.delete("/api/boards/{board_id}")
def delete_board(board_id: int, current_user=Depends(get_current_user)):
    """
    Удаляет доску вместе со всеми связанными сущностями (колонками и задачами).
    Только владелец workspace может удалить доску.
    """
    board = OrmQuery.get_board_by_id(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")

    # Получаем проект доски
    project = OrmQuery.get_project_by_id(board.projects_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    # Проверяем, что пользователь является владельцем workspace
    user_role = OrmQuery.get_user_workspace_role(current_user.id, project.workspaces_id)
    if user_role != "owner":
        raise HTTPException(
            status_code=403, 
            detail="Только владелец рабочего пространства может удалять доски"
        )

    # Удаляем доску со всеми связанными сущностями
    success = OrmQuery.delete_board(board_id)
    if not success:
        raise HTTPException(status_code=500, detail="Не удалось удалить доску")

    return {"status": "ok", "message": "Доска успешно удалена"}