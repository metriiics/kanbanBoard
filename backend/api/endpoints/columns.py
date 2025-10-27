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
