from fastapi import APIRouter
from db.OrmQuery import OrmQuery
from api.models.columns import ColumnTitleUpdate

router = APIRouter()

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