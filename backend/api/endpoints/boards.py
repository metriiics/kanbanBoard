from fastapi import APIRouter, Depends, HTTPException
from typing import List
from db.OrmQuery import OrmQuery
from api.models.boards import BoardCreate, BoardOut, BoardUpdateTitle
from core.security import get_current_user

router = APIRouter()

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