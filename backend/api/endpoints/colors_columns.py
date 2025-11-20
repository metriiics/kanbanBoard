# api/endpoints/colors.py
from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any
from db.OrmQuery import OrmQuery
from core.security import get_current_user

router = APIRouter(tags=["🎨 Цвета колонок"])

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
def update_color_column(
        column_id: int,
        column_data: Dict[str, Any] = Body(...),
        current_user=Depends(get_current_user)
    ) -> Dict[str, Any]:
    """Обновить цвет колонки"""
    try:
        color_id = column_data.get("color_id")
        if not isinstance(color_id, int):
            raise HTTPException(status_code=400, detail=f"Некорректный color_id: {color_id}")

        updated_column = OrmQuery.update_column_color(column_id, color_id)
        
        if not updated_column:
            raise HTTPException(status_code=404, detail="Колонка не найдена")
        
        return {
            "id": updated_column.id,
            "title": updated_column.title,
            "color": {
                "id": updated_column.color.id if updated_column.color else None,
                "name": updated_column.color.name if updated_column.color else None,
                "hex_code": updated_column.color.hex_code if updated_column.color else None,
            },
            "order_index": getattr(updated_column, "order_index", None)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении колонки: {str(e)}")