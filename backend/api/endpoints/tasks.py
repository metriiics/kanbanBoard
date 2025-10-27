from fastapi import APIRouter, Depends, HTTPException

from core.security import get_current_user
from api.models.tasks import BoardTasksOut, TaskFilledFieldsOut

router = APIRouter()

@router.get("/boards/{board_id}/tasks_by_columns", response_model=BoardTasksOut)
def get_tasks_by_board(board_id: int, current_user = Depends(get_current_user)):
    from db.OrmQuery import OrmQuery

    columns = OrmQuery.get_columns_with_tasks_by_board_id(board_id) or []

    # если колонок нет, проверим существует ли доска (пустая доска возможна)
    if not columns:
        try:
            board = OrmQuery.get_board_by_id(board_id)
        except Exception:
            board = None
        if board is None:
            raise HTTPException(status_code=404, detail="Board not found")
        project = getattr(board, "project", None)
        project_info = {"id": project.id, "title": getattr(project, "title", None), "workspaces_id": getattr(project, "workspaces_id", None)} if project else None
        return {
            "board_id": board.id,
            "board_title": getattr(board, "title", None),
            "project": project_info,
            "columns": []
        }

    first_board = getattr(columns[0], "board", None)
    project = getattr(first_board, "project", None) if first_board is not None else None
    project_info = {"id": project.id, "title": getattr(project, "title", None), "workspaces_id": getattr(project, "workspaces_id", None)} if project else None

    cols_out = []
    for c in columns:
        board_id_val = getattr(c, "board_id", None) or getattr(c, "boards_id", None) or (getattr(c, "board", None).id if getattr(c, "board", None) else None)
        cols_out.append({
            "id": c.id,
            "title": getattr(c, "title", None),
            "board_id": board_id_val,
            "tasks": [
                {
                    "id": t.id,
                    "title": getattr(t, "title", None),
                    "description": getattr(t, "description", None),
                    "board_id": getattr(t, "board_id", None) or board_id_val,
                    "column_id": getattr(t, "column_id", None) or getattr(t, "columns_id", None) or getattr(t, "columnsId", None),
                    "created_at": getattr(t, "created_at", None)
                }
                for t in getattr(c, "tasks", []) or []
            ]
        })

    return {
        "board_id": getattr(first_board, "id", board_id),
        "board_title": getattr(first_board, "title", None),
        "project": project_info,
        "columns": cols_out
    }

@router.get("/tasks/{task_id}/filled_fields", response_model=TaskFilledFieldsOut)
def get_task_filled_fields(task_id: int, current_user = Depends(get_current_user)):
    from db.OrmQuery import OrmQuery
    from db.dbstruct import Task as TaskModel

    task = OrmQuery.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    filled: dict = {}
    for col in TaskModel.__table__.columns:
        name = col.name
        value = getattr(task, name, None)
        if value is None:
            continue
        # сериализуем datetime
        if hasattr(value, "isoformat"):
            try:
                filled[name] = value.isoformat()
            except Exception:
                filled[name] = str(value)
        else:
            filled[name] = value

    return {"task_id": task.id, "filled_fields": filled}