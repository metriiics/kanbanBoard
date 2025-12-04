from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from db.OrmQuery import OrmQuery
from api.models.columns import ColumnTitleUpdate, ColumnCreate
from core.security import get_current_user
from core.logger import logger
from api.utils.permissions import can_view_project, can_edit_project
from db.database import get_db
from typing import List

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
def create_column(
    data: ColumnCreate, 
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создание новой колонки в доске.
    Проверяет доступ пользователя к доске через workspace.
    Только владелец может создавать колонки.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Не авторизован")
    
    # Проверяем существование доски
    board = OrmQuery.get_board_by_id(data.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    
    # Получаем проект доски
    project = OrmQuery.get_project_by_id(board.projects_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    # Проверяем доступ к проекту
    if not can_view_project(current_user.id, project.id, db):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")
    
    # Только владелец может создавать колонки
    if not can_edit_project(current_user.id, project.id, db):
        raise HTTPException(status_code=403, detail="Только владелец может создавать колонки")
    
    # Валидация данных
    if not data.title or not data.title.strip():
        raise HTTPException(status_code=400, detail="Название колонки не может быть пустым")
    
    if data.position < 0:
        raise HTTPException(status_code=400, detail="Позиция колонки должна быть неотрицательной")
    
    # Создаем колонку с проверкой доступа
    try:
        logger.info(f"Попытка создания колонки: board_id={data.board_id}, title={data.title}, position={data.position}, user_id={current_user.id}")
        
        new_column = OrmQuery.create_column(
            board_id=data.board_id,
            title=data.title.strip(),
            position=data.position,
            user_id=current_user.id
        )
        
        if not new_column:
            logger.error(f"Метод create_column вернул None для board_id={data.board_id}")
            raise HTTPException(
                status_code=500, 
                detail="Не удалось создать колонку"
            )
        
        logger.info(f"Колонка успешно создана: id={new_column.id}, title={new_column.title}")
        
        return {
            "id": new_column.id, 
            "title": new_column.title, 
            "position": new_column.position, 
            "board_id": new_column.board_id,
            "color_id": new_column.color_id
        }
    except SQLAlchemyError as e:
        logger.error(f"Ошибка базы данных при создании колонки: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка базы данных: {str(e)}"
        )
    except HTTPException:
        # Пробрасываем HTTP исключения как есть
        raise
    except Exception as e:
        logger.error(f"Неожиданная ошибка при создании колонки: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )

@router.get("/api/boards/{board_id}/columns/list")
def get_board_columns(board_id: int, current_user=Depends(get_current_user)):
    """
    Возвращает список всех колонок доски (без задач) для использования в фильтрах и создании задач.
    """
    columns = OrmQuery.get_columns_by_board_id(board_id)
    
    result = []
    for col in columns:
        color_info = None
        if hasattr(col, 'color') and col.color:
            color_info = {
                "id": col.color.id,
                "name": col.color.name,
                "hex_code": col.color.hex_code
            }
        
        result.append({
            "id": col.id,
            "title": getattr(col, "title", None),
            "board_id": getattr(col, "board_id", None),
            "position": getattr(col, "position", None),
            "color": color_info
        })
    
    return result