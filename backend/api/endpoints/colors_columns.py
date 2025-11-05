# api/endpoints/colors.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from db.OrmQuery import OrmQuery
from core.security import get_current_user

router = APIRouter()

@router.get("/api/colors")
def get_available_colors(current_user=Depends(get_current_user)) -> List[Dict[str, Any]]:
    """Получить доступные цвета для колонок"""
    colors = OrmQuery.get_available_colors()
    return [
        {
            "id": color.id,
            "name": color.name,
            "hex_code": color.hex_code
        }
        for color in colors
    ]

@router.put("/api/columns/color/{column_id}")
def update_column(
    column_id: int,
    column_data: dict,
    current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Обновить колонку (название, цвет, порядок и т.д.)"""
    try:
        updated_column = OrmQuery.update_column(column_id, column_data)
        
        if not updated_column:
            raise HTTPException(status_code=404, detail="Колонка не найдена")
        
        return {
            "id": updated_column.id,
            "title": updated_column.title,
            "color": {
                "id": updated_column.color.id,
                "name": updated_column.color.name,
                "hex_code": updated_column.color.hex_code
            },
            "order_index": updated_column.order_index
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении колонки: {str(e)}")