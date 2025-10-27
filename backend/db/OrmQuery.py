from sqlalchemy import select, and_
from fastapi import Depends

from core.security import hash_password

from db.database import engine, Base, session_factory
from db.dbstruct import User, Workspace, Project, Board, Column, Task
from api.models.user import UserCreate

from sqlalchemy.orm import joinedload

class OrmQuery:
    @staticmethod
    def create_tables():
        Base.metadata.create_all(engine)
    
    @staticmethod
    def get_user_by_id(user_id: int) -> User | None:
        with session_factory() as session:
            return session.query(User).filter(User.id == user_id).first()
        
    @staticmethod
    def get_user_by_email(email: str) -> User | None:
        with session_factory() as session:
            return session.query(User).filter(User.email == email).first()
    
    @staticmethod
    def create_user(user: UserCreate) -> User:
        with session_factory() as session:
            new_user = User(
                email=user.email,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                password=hash_password(user.password)
            )
            session.add(new_user)

            # создаём дефолтный воркспейс и связываем с пользователем
            ws_name = f"{user.username}'s workspace" if user.username else "Workspace"
            new_workspace = Workspace(
                name=ws_name,
                description="Рабочее пространство созданное по умолчанию"
            )
            session.add(new_workspace)

            # устанавливаем связь через relationship (secondary table handled в моделях)
            new_user.workspaces.append(new_workspace)

            session.commit()
            session.refresh(new_user)
            session.refresh(new_workspace)
            return new_user  

    @staticmethod
    def get_board_by_id(board_id: int):
        with session_factory() as session:
            return (
                session.query(Board)
                .options(joinedload(Board.project))
                .filter(Board.id == board_id)
                .first()
            )
        
    @staticmethod
    def get_projects_by_user_id(user_id: int):
        """
        Возвращает список Project для workspaces, в которых состоит пользователь user_id,
        заранее подгружая доски (joinedload).
        """
        with session_factory() as session:
            return (
                session.query(Project)
                .join(Project.workspace)             # join на workspace через relationship
                .join(Workspace.users)               # join на users через secondary association
                .filter(User.id == user_id)          # фильтр по пользователю
                .options(joinedload(Project.boards)) # заранее подгружаем доски
                .all()
            )

    @staticmethod
    def get_columns_with_tasks_by_board_id(board_id: int):
        with session_factory() as session:
            return (
                session.query(Column)
                .filter(Column.board_id == board_id)
                .options(
                    joinedload(Column.tasks),                         # подгружаем задачи колонки
                    joinedload(Column.board).joinedload(Board.project) # подгружаем board -> project
                )
                .all()
            )
        
    @staticmethod
    def get_task_by_id(task_id: int):
        with session_factory() as session:
            return session.query(Task).filter(Task.id == task_id).first()