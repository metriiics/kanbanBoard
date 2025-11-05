from fastapi import APIRouter, Depends, HTTPException

from core.security import get_current_user
from api.models.tasks import BoardTasksOut, TaskFilledFieldsOut, TaskCardOut, TaskDetailOut, TaskCreate, TaskUpdate
from db.OrmQuery import OrmQuery

from db.dbstruct import Task as TaskModel


router = APIRouter()

@router.post("/api/tasks", response_model=TaskCardOut)
def create_task_endpoint(payload: TaskCreate, current_user = Depends(get_current_user)):
    """
    Создаёт новую задачу с минимальными полями при создании на доске.
    Сохраняется только title и column_id. Возвращает минимальные данные для карточки на доске.
    """
    task = OrmQuery.create_task(title=payload.title, column_id=payload.column_id, assigned_to=None)
    if not task:
        raise HTTPException(status_code=404, detail="Column not found")

    return {
        "id": task.id,
        "title": getattr(task, "title", None),
        "labels": [],
        "assignee": None
    }

@router.get("/api/boards/{board_id}/columns", response_model=BoardTasksOut)
def get_tasks_by_board(board_id: int, current_user = Depends(get_current_user)):

    """
    Возвращает колонки и задачи для указанной доски.
    """

    columns = OrmQuery.get_columns_with_tasks_by_board_id(board_id) or []

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
        
        # Добавляем информацию о цвете
        color_info = None
        if hasattr(c, 'color') and c.color:
            color_info = {
                "id": c.color.id,
                "name": c.color.name,
                "hex_code": c.color.hex_code
            }
        
        cols_out.append({
            "id": c.id,
            "title": getattr(c, "title", None),
            "board_id": board_id_val,
            "color": color_info,  # ← ДОБАВЛЯЕМ ЦВЕТ
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

@router.get("/api/tasks/{task_id}", response_model=TaskFilledFieldsOut)
def get_task_filled_fields(task_id: int, current_user = Depends(get_current_user)):

    """
    Возвращает заполненные поля задачи в виде словаря: имя_поля -> значение
    """

    task = OrmQuery.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    filled: dict = {}
    for col in TaskModel.__table__.columns:
        name = col.name
        value = getattr(task, name, None)
        if value is None:
            continue
        if hasattr(value, "isoformat"):
            try:
                filled[name] = value.isoformat()
            except Exception:
                filled[name] = str(value)
        else:
            filled[name] = value

    return {"task_id": task.id, "filled_fields": filled}

@router.get("/api/tasks/{task_id}/card", response_model=TaskCardOut)
def get_task_card(task_id: int, current_user = Depends(get_current_user)):

    """
    Возвращает минимальные данные задачи для отображения на доске:
    - title
    - labels (теги)
    - assignee (выполняющий человек)
    """

    task = OrmQuery.get_task_with_relations(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    labels = [
        {"id": l.id, "name": getattr(l, "name", None), "color": getattr(l, "color", None)}
        for l in getattr(task, "labels", []) or []
    ]

    assignee = None
    a = getattr(task, "assignee", None)
    if a:
        assignee = {
            "id": a.id,
            "first_name": getattr(a, "first_name", None),
            "last_name": getattr(a, "last_name", None),
            "username": getattr(a, "username", None),
            "email": getattr(a, "email", None),
        }

    return {"id": task.id, "title": getattr(task, "title", None), "labels": labels, "assignee": assignee}

@router.get("/api/tasks/{task_id}/details", response_model=TaskDetailOut)
def get_task_details(task_id: int, current_user = Depends(get_current_user)):
    """
    Возвращает подробные данные задачи для страницы детального просмотра:
    - все основные поля задачи (title, description, priority, due_date и т.д.)
    - column (id, title, board_id)
    - labels
    - assignee
    - comments (с информацией о пользователе и времени)
    """
    task = OrmQuery.get_task_with_relations(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    labels = [
        {"id": l.id, "name": getattr(l, "name", None), "color": getattr(l, "color", None)}
        for l in getattr(task, "labels", []) or []
    ]

    assignee = None
    a = getattr(task, "assignee", None)
    if a:
        assignee = {
            "id": a.id,
            "first_name": getattr(a, "first_name", None),
            "last_name": getattr(a, "last_name", None),
            "username": getattr(a, "username", None),
            "email": getattr(a, "email", None),
        }

    column = None
    col = getattr(task, "column", None)
    if col:
        board_id_val = getattr(col, "board_id", None) or (getattr(col, "board", None).id if getattr(col, "board", None) else None)
        column = {"id": col.id, "title": getattr(col, "title", None), "board_id": board_id_val}

    comments = []
    for com in getattr(task, "comments", []) or []:
        cu = getattr(com, "user", None)
        user_obj = None
        if cu:
            user_obj = {
                "id": cu.id,
                "first_name": getattr(cu, "first_name", None),
                "last_name": getattr(cu, "last_name", None),
                "username": getattr(cu, "username", None),
                "email": getattr(cu, "email", None),
            }
        comments.append({
            "id": com.id,
            "content": getattr(com, "content", None),
            "user": user_obj,
            "created_at": getattr(com, "created_at", None)
        })

    return {
        "id": task.id,
        "title": getattr(task, "title", None),
        "description": getattr(task, "description", None),
        "common_id": getattr(task, "common_id", None),
        "priority": getattr(task, "priority", None),
        "created_at": getattr(task, "created_at", None),
        "due_date": getattr(task, "due_date", None),
        "column": column,
        "labels": labels,
        "assignee": assignee,
        "comments": comments
    }

@router.put("/api/tasks/{task_id}", response_model=TaskDetailOut)
def update_task(task_id: int, payload: TaskUpdate, current_user = Depends(get_current_user)):
    """
    Обновляет все поля задачи из формы детального редактирования.
    Принимает частичные данные — сохраняет только переданные поля.
    Возвращает актуальные подробные данные задачи.
    """
    upd = OrmQuery.update_task(task_id, payload.dict(exclude_unset=True))
    if not upd:
        raise HTTPException(status_code=404, detail="Неверные данные для обновления задачи")

    # вернуть актуальную задачу с связями
    task = OrmQuery.get_task_with_relations(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена после обновления")

    # собрать ответ (аналогично get_task_details)
    labels = [
        {"id": l.id, "name": getattr(l, "name", None), "color": getattr(l, "color", None)}
        for l in getattr(task, "labels", []) or []
    ]

    assignee = None
    a = getattr(task, "assignee", None)
    if a:
        assignee = {
            "id": a.id,
            "first_name": getattr(a, "first_name", None),
            "last_name": getattr(a, "last_name", None),
            "username": getattr(a, "username", None),
            "email": getattr(a, "email", None),
        }

    column = None
    col = getattr(task, "column", None)
    if col:
        board_id_val = getattr(col, "board_id", None) or (getattr(col, "board", None).id if getattr(col, "board", None) else None)
        column = {"id": col.id, "title": getattr(col, "title", None), "board_id": board_id_val}

    comments = []
    for com in getattr(task, "comments", []) or []:
        cu = getattr(com, "user", None)
        user_obj = None
        if cu:
            user_obj = {
                "id": cu.id,
                "first_name": getattr(cu, "first_name", None),
                "last_name": getattr(cu, "last_name", None),
                "username": getattr(cu, "username", None),
                "email": getattr(cu, "email", None),
            }
        comments.append({
            "id": com.id,
            "content": getattr(com, "content", None),
            "user": user_obj,
            "created_at": getattr(com, "created_at", None)
        })

    return {
        "id": task.id,
        "title": getattr(task, "title", None),
        "description": getattr(task, "description", None),
        "common_id": getattr(task, "common_id", None),
        "priority": getattr(task, "priority", None),
        "created_at": getattr(task, "created_at", None),
        "due_date": getattr(task, "due_date", None),
        "column": column,
        "labels": labels,
        "assignee": assignee,
        "comments": comments
    }