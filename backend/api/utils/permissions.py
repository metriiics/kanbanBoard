"""
Утилиты для проверки прав доступа пользователей
"""
from typing import Optional
from sqlalchemy.orm import Session

from db.dbstruct import UserWorkspace, UserProjectAccess
from db.OrmQuery import OrmQuery


def can_view_project(user_id: int, project_id: int, db: Session) -> bool:
    """
    Проверяет, может ли пользователь просматривать проект.
    Владелец workspace имеет доступ ко всем проектам.
    """
    project = OrmQuery.get_project_by_id(project_id)
    if not project:
        return False
    
    # Получаем роль пользователя в workspace
    user_role = OrmQuery.get_user_workspace_role(user_id, project.workspaces_id)
    if not user_role:
        return False
    
    # Владелец имеет доступ ко всем проектам
    if user_role.lower() == "owner":
        return True
    
    # Проверяем доступ к проекту через UserProjectAccess
    access = (
        db.query(UserProjectAccess)
        .filter(
            UserProjectAccess.user_id == user_id,
            UserProjectAccess.project_id == project_id,
            UserProjectAccess.can_view == True
        )
        .first()
    )
    
    return access is not None


def can_edit_project(user_id: int, project_id: int, db: Session) -> bool:
    """
    Проверяет, может ли пользователь редактировать проект.
    Только владелец может редактировать проект.
    """
    project = OrmQuery.get_project_by_id(project_id)
    if not project:
        return False
    
    user_role = OrmQuery.get_user_workspace_role(user_id, project.workspaces_id)
    if not user_role:
        return False
    
    return user_role.lower() == "owner"


def can_create_task(user_id: int, column_id: int, db: Session) -> bool:
    """
    Проверяет, может ли пользователь создавать задачи.
    Участник (participant) и владелец (owner) могут создавать задачи.
    """
    from db.dbstruct import Column, Board, Project
    column_obj = db.query(Column).filter(Column.id == column_id).first()
    if not column_obj:
        return False
    
    board = db.query(Board).filter(Board.id == column_obj.board_id).first()
    if not board:
        return False
    
    project = db.query(Project).filter(Project.id == board.projects_id).first()
    if not project:
        return False
    
    # Проверяем доступ к проекту
    if not can_view_project(user_id, project.id, db):
        return False
    
    # Получаем роль
    user_role = OrmQuery.get_user_workspace_role(user_id, project.workspaces_id)
    if not user_role:
        return False
    
    role_lower = user_role.lower()
    # Участник и владелец могут создавать задачи
    return role_lower in ["participant", "owner"]


def can_edit_task(user_id: int, task_id: int, db: Session) -> bool:
    """
    Проверяет, может ли пользователь редактировать задачу.
    Участник (participant) и владелец (owner) могут редактировать задачи.
    """
    task = OrmQuery.get_task_with_relations(task_id)
    if not task:
        return False
    
    column = getattr(task, "column", None)
    if not column:
        return False
    
    board = getattr(column, "board", None)
    if not board:
        return False
    
    project = getattr(board, "project", None)
    if not project:
        return False
    
    # Проверяем доступ к проекту
    if not can_view_project(user_id, project.id, db):
        return False
    
    # Получаем роль
    user_role = OrmQuery.get_user_workspace_role(user_id, project.workspaces_id)
    if not user_role:
        return False
    
    role_lower = user_role.lower()
    # Участник и владелец могут редактировать задачи
    return role_lower in ["participant", "owner"]


def can_delete_task(user_id: int, task_id: int, db: Session) -> bool:
    """
    Проверяет, может ли пользователь удалять задачу.
    Участник (participant) и владелец (owner) могут удалять задачи.
    """
    return can_edit_task(user_id, task_id, db)


def can_comment_task(user_id: int, task_id: int, db: Session) -> bool:
    """
    Проверяет, может ли пользователь комментировать задачу.
    Комментатор (commenter), участник (participant) и владелец (owner) могут комментировать.
    """
    task = OrmQuery.get_task_with_relations(task_id)
    if not task:
        return False
    
    column = getattr(task, "column", None)
    if not column:
        return False
    
    board = getattr(column, "board", None)
    if not board:
        return False
    
    project = getattr(board, "project", None)
    if not project:
        return False
    
    # Проверяем доступ к проекту
    if not can_view_project(user_id, project.id, db):
        return False
    
    # Получаем роль
    user_role = OrmQuery.get_user_workspace_role(user_id, project.workspaces_id)
    if not user_role:
        return False
    
    role_lower = user_role.lower()
    # Комментатор, участник и владелец могут комментировать
    return role_lower in ["commenter", "participant", "owner"]


def get_user_accessible_projects(user_id: int, workspace_id: int, db: Session) -> list:
    """
    Возвращает список проектов, к которым у пользователя есть доступ.
    Владелец получает все проекты workspace.
    """
    from db.dbstruct import Project
    
    # Получаем роль пользователя
    user_role = OrmQuery.get_user_workspace_role(user_id, workspace_id)
    if not user_role:
        return []
    
    # Владелец получает все проекты
    if user_role.lower() == "owner":
        return OrmQuery.get_projects_by_workspace_id(workspace_id) or []
    
    # Для остальных получаем проекты с доступом
    accessible_project_ids = OrmQuery.get_user_project_accesses(user_id, workspace_id)
    if not accessible_project_ids:
        return []
    
    projects = (
        db.query(Project)
        .filter(
            Project.workspaces_id == workspace_id,
            Project.id.in_(accessible_project_ids)
        )
        .all()
    )
    
    return projects

