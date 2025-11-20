from fastapi import APIRouter, Depends, HTTPException
from typing import List
from db.OrmQuery import OrmQuery
from api.models.boards import BoardCreate, BoardOut, BoardUpdateTitle
from core.security import get_current_user

router = APIRouter(tags=["📋 Доски"])

@router.post("/api/boards/create", response_model=BoardOut)
def create_board_endpoint(board: BoardCreate, current_user=Depends(get_current_user)):
    """
    Создает доску и автоматически добавляет стандартные колонки.
    """
    project = OrmQuery.get_project_by_id(board.projects_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    new_board = OrmQuery.create_board(board)
    return new_board

@router.put("/api/boards/{board_id}/title", response_model=BoardOut)
def update_board_title(board_id: int, board_update: BoardUpdateTitle, current_user=Depends(get_current_user)):
    """
    Обновляет название доски по её ID.
    """
    board = OrmQuery.get_board_by_id(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")

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