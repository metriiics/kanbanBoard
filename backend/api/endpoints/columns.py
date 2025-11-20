from fastapi import APIRouter, Depends
from db.OrmQuery import OrmQuery
from api.models.columns import ColumnTitleUpdate, ColumnCreate
from core.security import get_current_user

router = APIRouter(tags=["📊 Колонки"])

@router.put("/api/columns/update_positions")
def update_positions(payload: list[dict]):

    """
    Обновление позиций колонок
    """
    
    OrmQuery.update_column_positions(payload)
    return {"status": "ok"}

@router.put("/api/columns/{column_id}/title")
def update_column_title(column_id: int, data: ColumnTitleUpdate):
    """
    Обновление названия колонки
    """
    updated_column = OrmQuery.update_column_title(column_id, data.title)
    return {"id": updated_column.id, "title": updated_column.title}

@router.post("/api/columns")
def create_column(data: ColumnCreate, current_user=Depends(get_current_user)):

    if not current_user:
        return {"error": "Unauthorized"}, 401
    """
    Создание новой колонки
    """
    new_column = OrmQuery.create_column(
        title=data.title,
        position=data.position,
        board_id=data.board_id
    )
    return {"id": new_column.id, "title": new_column.title, "position": new_column.position, "board_id": new_column.board_id}