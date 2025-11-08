from fastapi import APIRouter
from db.OrmQuery import OrmQuery

router = APIRouter()

@router.put("/api/columns/update_positions")
def update_positions(payload: list[dict]):

    """
    Обновление позиций колонок
    """
    
    OrmQuery.update_column_positions(payload)
    return {"status": "ok"}

@router.put("/api/columns/{column_id}/title")
def update_column_title(column_id: int, title: str):

    """
    Обновление названия колонки
    """
    
    OrmQuery.update_column_title(column_id, title)
    return {column_id: title}