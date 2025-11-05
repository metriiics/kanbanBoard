from fastapi import APIRouter, Depends, HTTPException
from typing import List
from db.OrmQuery import OrmQuery
from api.models.boards import BoardCreate, BoardOut
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
