from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from sqlalchemy.orm import Session

from core.security import get_current_user
from api.models.tasks import BoardTasksOut, TaskFilledFieldsOut, TaskCardOut, TaskDetailOut, TaskCreate, TaskUpdate, TaskCommentOut, CommentCreate, UserTaskOut, CalendarTaskOut
from db.OrmQuery import OrmQuery
from api.utils.permissions import can_create_task, can_edit_task, can_delete_task, can_comment_task, can_view_project
from db.database import get_db

from db.dbstruct import Task as TaskModel
from typing import List


router = APIRouter(tags=["✅ Задачи"])

@router.post("/api/tasks", response_model=TaskCardOut)
def create_task_endpoint(
    payload: TaskCreate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создаёт новую задачу с минимальными полями при создании на доске.
    Сохраняется только title и column_id. Возвращает минимальные данные для карточки на доске.
    Проверяет права доступа: только участник (participant) и владелец (owner) могут создавать задачи.
    """
    # Проверяем право на создание задачи
    if not can_create_task(current_user.id, payload.column_id, db):
        raise HTTPException(
            status_code=403, 
            detail="Недостаточно прав для создания задачи. Только участники и владельцы могут создавать задачи."
        )
    
    task = OrmQuery.create_task(title=payload.title, column_id=payload.column_id, assigned_to=None, created_by=current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Column not found")

    return {
        "id": task.id,
        "title": getattr(task, "title", None),
        "labels": [],
        "assignee": None
    }

@router.get("/api/boards/{board_id}/columns", response_model=BoardTasksOut)
def get_tasks_by_board(
    board_id: int, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Возвращает колонки и задачи для указанной доски.
    Проверяет доступ пользователя к проекту доски.
    """
    # Получаем доску и проверяем доступ к проекту
    board = OrmQuery.get_board_by_id(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    
    project = getattr(board, "project", None)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    # Проверяем доступ к проекту
    if not can_view_project(current_user.id, project.id, db):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")

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
        
        tasks_out = []
        for t in getattr(c, "tasks", []) or []:
            assignee_links = getattr(t, "assignee_links", []) or []
            assignee = getattr(t, "assignee", None)
            
            task_data = {
                "id": t.id,
                "title": getattr(t, "title", None),
                "description": getattr(t, "description", None),
                "priority": getattr(t, "priority", None),
                "due_date": getattr(t, "due_date", None),
                "board_id": getattr(t, "board_id", None) or board_id_val,
                "column_id": getattr(t, "column_id", None) or getattr(t, "columns_id", None) or getattr(t, "columnsId", None),
                "created_at": getattr(t, "created_at", None),
                "labels": [
                    {
                        "id": l.id,
                        "name": getattr(l, "name", None),
                        "color": getattr(l, "color", None)
                    }
                    for l in getattr(t, "labels", []) or []
                ],
                "assignee": (
                    {
                        "id": assignee.id,
                        "first_name": getattr(assignee, "first_name", None),
                        "last_name": getattr(assignee, "last_name", None),
                        "username": getattr(assignee, "username", None),
                        "email": getattr(assignee, "email", None),
                        "avatar_url": getattr(assignee, "avatar_url", None),
                    }
                    if assignee
                    else None
                ),
                "assignees": [
                    {
                        "id": getattr(ta, "user", None).id if getattr(ta, "user", None) else None,
                        "first_name": getattr(getattr(ta, "user", None), "first_name", None) if getattr(ta, "user", None) else None,
                        "last_name": getattr(getattr(ta, "user", None), "last_name", None) if getattr(ta, "user", None) else None,
                        "username": getattr(getattr(ta, "user", None), "username", None) if getattr(ta, "user", None) else None,
                        "email": getattr(getattr(ta, "user", None), "email", None) if getattr(ta, "user", None) else None,
                        "avatar_url": getattr(getattr(ta, "user", None), "avatar_url", None) if getattr(ta, "user", None) else None,
                    }
                    for ta in assignee_links
                    if getattr(ta, "user", None) is not None
                ],
            }
            tasks_out.append(task_data)
        
        cols_out.append({
            "id": c.id,
            "title": getattr(c, "title", None),
            "board_id": board_id_val,
            "color": color_info,
            "tasks": tasks_out
        })

    return {
        "board_id": getattr(first_board, "id", board_id),
        "board_title": getattr(first_board, "title", None),
        "project": project_info,
        "columns": cols_out
    }

@router.get("/api/tasks/{task_id}", response_model=TaskFilledFieldsOut)
def get_task_filled_fields(
    task_id: int, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Возвращает заполненные поля задачи в виде словаря: имя_поля -> значение
    Проверяет доступ к проекту задачи.
    """
    task = OrmQuery.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    # Получаем проект через колонку и доску
    task_with_relations = OrmQuery.get_task_with_relations(task_id)
    if not task_with_relations:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    column = getattr(task_with_relations, "column", None)
    if not column:
        raise HTTPException(status_code=404, detail="Колонка не найдена")
    
    board = getattr(column, "board", None)
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    
    project = getattr(board, "project", None)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    # Проверяем доступ к проекту
    if not can_view_project(current_user.id, project.id, db):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")

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
def get_task_card(
    task_id: int, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    """
    Возвращает минимальные данные задачи для отображения на доске:
    - title
    - labels (теги)
    - assignee (выполняющий человек)
    """

    task = OrmQuery.get_task_with_relations(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    # Проверяем доступ к проекту
    column = getattr(task, "column", None)
    if not column:
        raise HTTPException(status_code=404, detail="Колонка не найдена")
    
    board = getattr(column, "board", None)
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    
    project = getattr(board, "project", None)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    if not can_view_project(current_user.id, project.id, db):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")

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
def get_task_details(
    task_id: int, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Возвращает подробные данные задачи для страницы детального просмотра:
    - все основные поля задачи (title, description, priority, due_date и т.д.)
    - column (id, title, board_id)
    - labels
    - assignee
    - author (создатель задачи)
    - comments (с информацией о пользователе и времени)
    Проверяет доступ к проекту задачи.
    """
    task = OrmQuery.get_task_with_relations(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    # Проверяем доступ к проекту
    column = getattr(task, "column", None)
    if not column:
        raise HTTPException(status_code=404, detail="Колонка не найдена")
    
    board = getattr(column, "board", None)
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    
    project = getattr(board, "project", None)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    if not can_view_project(current_user.id, project.id, db):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")

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

    # Множественные исполнители через TaskAssignee
    assignees = []
    assignee_links = getattr(task, "assignee_links", []) or []
    for ta in assignee_links:
        assignee_user = getattr(ta, "user", None)
        if assignee_user:
            assignees.append({
                "id": assignee_user.id,
                "first_name": getattr(assignee_user, "first_name", None),
                "last_name": getattr(assignee_user, "last_name", None),
                "username": getattr(assignee_user, "username", None),
                "email": getattr(assignee_user, "email", None),
                "avatar_url": getattr(assignee_user, "avatar_url", None),
            })

    author = None
    auth = getattr(task, "author", None)
    if auth:
        author = {
            "id": auth.id,
            "first_name": getattr(auth, "first_name", None),
            "last_name": getattr(auth, "last_name", None),
            "username": getattr(auth, "username", None),
            "email": getattr(auth, "email", None),
        }

    column = None
    col = getattr(task, "column", None)
    if col:
        board_id_val = getattr(col, "board_id", None) or (getattr(col, "board", None).id if getattr(col, "board", None) else None)
        project_info = None
        board = getattr(col, "board", None)
        if board:
            project = getattr(board, "project", None)
            if project:
                project_info = {
                    "id": project.id,
                    "title": getattr(project, "title", None),
                    "workspaces_id": getattr(project, "workspaces_id", None)
                }
        column = {"id": col.id, "title": getattr(col, "title", None), "board_id": board_id_val, "project": project_info}

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
        "assignees": assignees,
        "author": author,
        "comments": comments
    }

@router.put("/api/tasks/{task_id}", response_model=TaskDetailOut)
def update_task(
    task_id: int, 
    payload: TaskUpdate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Обновляет все поля задачи из формы детального редактирования.
    Принимает частичные данные — сохраняет только переданные поля.
    Возвращает актуальные подробные данные задачи.
    Проверяет права доступа: только участник (participant) и владелец (owner) могут редактировать задачи.
    """
    # Проверяем право на редактирование задачи
    if not can_edit_task(current_user.id, task_id, db):
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для редактирования задачи. Только участники и владельцы могут редактировать задачи."
        )
    
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

    # Множественные исполнители через TaskAssignee
    assignees = []
    assignee_links = getattr(task, "assignee_links", []) or []
    for ta in assignee_links:
        assignee_user = getattr(ta, "user", None)
        if assignee_user:
            assignees.append({
                "id": assignee_user.id,
                "first_name": getattr(assignee_user, "first_name", None),
                "last_name": getattr(assignee_user, "last_name", None),
                "username": getattr(assignee_user, "username", None),
                "email": getattr(assignee_user, "email", None),
                "avatar_url": getattr(assignee_user, "avatar_url", None),
            })

    author = None
    auth = getattr(task, "author", None)
    if auth:
        author = {
            "id": auth.id,
            "first_name": getattr(auth, "first_name", None),
            "last_name": getattr(auth, "last_name", None),
            "username": getattr(auth, "username", None),
            "email": getattr(auth, "email", None),
        }

    column = None
    col = getattr(task, "column", None)
    if col:
        board_id_val = getattr(col, "board_id", None) or (getattr(col, "board", None).id if getattr(col, "board", None) else None)
        project_info = None
        board = getattr(col, "board", None)
        if board:
            project = getattr(board, "project", None)
            if project:
                project_info = {
                    "id": project.id,
                    "title": getattr(project, "title", None),
                    "workspaces_id": getattr(project, "workspaces_id", None)
                }
        column = {"id": col.id, "title": getattr(col, "title", None), "board_id": board_id_val, "project": project_info}

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

    # Получаем автора
    author = None
    auth = getattr(task, "author", None)
    if auth:
        author = {
            "id": auth.id,
            "first_name": getattr(auth, "first_name", None),
            "last_name": getattr(auth, "last_name", None),
            "username": getattr(auth, "username", None),
            "email": getattr(auth, "email", None),
        }

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
        "assignees": assignees,
        "author": author,
        "comments": comments
    }

@router.post("/api/tasks/{task_id}/comments", response_model=TaskCommentOut)
def create_comment(
    task_id: int, 
    payload: CommentCreate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создаёт новый комментарий к задаче.
    Проверяет права доступа: комментатор (commenter), участник (participant) и владелец (owner) могут комментировать.
    """
    # Проверяем право на комментирование
    if not can_comment_task(current_user.id, task_id, db):
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для комментирования. Только комментаторы, участники и владельцы могут комментировать задачи."
        )
    
    comment = OrmQuery.create_comment(task_id=task_id, user_id=current_user.id, content=payload.content)
    if not comment:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    # Загружаем комментарий с пользователем
    task = OrmQuery.get_task_with_relations(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    # Находим созданный комментарий
    created_comment = None
    for com in getattr(task, "comments", []) or []:
        if com.id == comment.id:
            created_comment = com
            break
    
    if not created_comment:
        raise HTTPException(status_code=500, detail="Ошибка при создании комментария")
    
    cu = getattr(created_comment, "user", None)
    user_obj = None
    if cu:
        user_obj = {
            "id": cu.id,
            "first_name": getattr(cu, "first_name", None),
            "last_name": getattr(cu, "last_name", None),
            "username": getattr(cu, "username", None),
            "email": getattr(cu, "email", None),
        }
    
    return {
        "id": created_comment.id,
        "content": getattr(created_comment, "content", None),
        "user": user_obj,
        "created_at": getattr(created_comment, "created_at", None)
    }

@router.get("/api/users/me/tasks", response_model=List[UserTaskOut])
def get_user_tasks(
    workspace_id: int | None = Query(default=None, description="ID рабочего пространства (опционально)"),
    current_user = Depends(get_current_user)
):
    """
    Возвращает задачи, назначенные текущему пользователю.
    Если указан workspace_id, возвращает только задачи из проектов этого workspace.
    """
    tasks = OrmQuery.get_user_tasks(current_user.id, workspace_id)
    
    result = []
    for task in tasks:
        column = getattr(task, "column", None)
        status = getattr(column, "title", None) if column else None
        
        # Получаем цвет колонки
        status_color = None
        if column:
            color = getattr(column, "color", None)
            if color:
                status_color = getattr(color, "hex_code", None)
        
        project_title = None
        
        if column:
            board = getattr(column, "board", None)
            if board:
                project = getattr(board, "project", None)
                if project:
                    project_title = getattr(project, "title", None)
        
        author = None
        auth = getattr(task, "author", None)
        if auth:
            author = {
                "id": auth.id,
                "first_name": getattr(auth, "first_name", None),
                "last_name": getattr(auth, "last_name", None),
                "username": getattr(auth, "username", None),
                "email": getattr(auth, "email", None),
            }
        
        result.append({
            "id": task.id,
            "title": getattr(task, "title", None),
            "priority": getattr(task, "priority", None),
            "status": status,
            "status_color": status_color,
            "created_at": getattr(task, "created_at", None),
            "due_date": getattr(task, "due_date", None),
            "project_title": project_title,
            "author": author
        })
    
    return result

@router.get("/api/boards/{board_id}/calendar/tasks", response_model=List[CalendarTaskOut])
def get_calendar_tasks(
    board_id: int,
    start_date: datetime | None = Query(default=None, description="Начальная дата для фильтрации"),
    end_date: datetime | None = Query(default=None, description="Конечная дата для фильтрации"),
    column_id: int | None = Query(default=None, description="ID колонки (статус) для фильтрации"),
    assigned_to: int | None = Query(default=None, description="ID исполнителя для фильтрации"),
    label_id: int | None = Query(default=None, description="ID тега для фильтрации"),
    current_user = Depends(get_current_user)
):
    """
    Возвращает задачи для календаря с фильтрами.
    """
    tasks = OrmQuery.get_calendar_tasks(
        board_id=board_id,
        start_date=start_date,
        end_date=end_date,
        column_id=column_id,
        assigned_to=assigned_to,
        label_id=label_id
    )
    
    result = []
    for task in tasks:
        column = getattr(task, "column", None)
        column_title = getattr(column, "title", None) if column else None
        
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
                "avatar_url": getattr(a, "avatar_url", None),
            }
        
        result.append({
            "id": task.id,
            "title": getattr(task, "title", None),
            "description": getattr(task, "description", None),
            "priority": getattr(task, "priority", None),
            "due_date": getattr(task, "due_date", None),
            "column_id": getattr(task, "column_id", None),
            "column_title": column_title,
            "created_at": getattr(task, "created_at", None),
            "labels": labels,
            "assignee": assignee
        })
    
    return result