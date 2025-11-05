from sqlalchemy import select, and_
from fastapi import Depends

from core.security import hash_password

from db.database import engine, Base, session_factory
from db.dbstruct import User, Workspace, Project, Board, Column, Task, UserWorkspace, Comment, Label
from api.models.user import UserCreate

from sqlalchemy.orm import joinedload

class OrmQuery:
    @staticmethod
    def create_tables():

        '''
        Создает все таблицы в базе данных.
        '''

        Base.metadata.create_all(engine)
    
    @staticmethod
    def get_user_by_id(user_id: int) -> User | None:

        '''
        Возвращает пользователя по его ID.
        '''

        with session_factory() as session:
            return session.query(User).filter(User.id == user_id).first()
        
    @staticmethod
    def get_user_by_email(email: str) -> User | None:

        '''
        Возвращает пользователя по его email.
        '''

        with session_factory() as session:
            return session.query(User).filter(User.email == email).first()
    
    @staticmethod
    def create_user(user: UserCreate) -> User:

        '''
        Создает нового пользователя.
        '''

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
            ws_name = user.username if user.username else "Workspace"
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

        '''
        Возвращает доску по ее ID.
        '''

        with session_factory() as session:
            return (
                session.query(Board)
                .options(joinedload(Board.project))
                .filter(Board.id == board_id)
                .first()
            )
        
    @staticmethod
    def get_workspace_by_user_id(user_id: int) -> Workspace | None:

        """
        Возвращает рабочее пространство по user_id
        """

        with session_factory() as session:
            return (
                session.query(Workspace)
                .join(UserWorkspace, Workspace.id == UserWorkspace.workspace_id)
                .filter(UserWorkspace.user_id == user_id)
                .first()
            )

    @staticmethod
    def get_projects_by_workspace_id(workspace_id: int) -> list[Project]:

        """
        Возвращает проекты по workspace_id вместе с досками
        """

        with session_factory() as session:
            projects = (
                session.query(Project)
                .options(joinedload(Project.boards))
                .filter(Project.workspaces_id == workspace_id)
                .all()
            )
            return projects

    @staticmethod
    def get_columns_with_tasks_by_board_id(board_id: int):

        """
        Возвращает колонки с задачами для указанной доски.
        """

        with session_factory() as session:
            return (
                session.query(Column)
                .filter(Column.board_id == board_id)
                .options(
                    joinedload(Column.tasks),                         # подгружаем задачи колонки
                    joinedload(Column.board).joinedload(Board.project) # подгружаем board -> project
                )
                .order_by(Column.position.asc())
                .all()
            )
        
    @staticmethod
    def get_task_by_id(task_id: int):

        '''
        Возвращает задачу по ее ID.
        '''

        with session_factory() as session:
            return session.query(Task).filter(Task.id == task_id).first()
        
    @staticmethod
    def get_task_with_relations(task_id: int):

        """
        Возвращает задачу вместе с подгруженными relations (labels, assignee, column->board, comments->user),
        чтобы работать с ними после закрытия сессии.
        """

        with session_factory() as session:
            return (
                session.query(Task)
                .options(
                    joinedload(Task.labels),
                    joinedload(Task.assignee),
                    joinedload(Task.column).joinedload(Column.board),
                    joinedload(Task.comments).joinedload(Comment.user)
                )
                .filter(Task.id == task_id)
                .first()
            )

    @staticmethod
    def create_task(title: str, column_id: int, assigned_to: int | None = None):
        """
        Создаёт задачу с минимальными полями (title, column_id).
        Возвращает объект Task или None, если колонка не найдена.
        """
        with session_factory() as session:
            col = session.query(Column).filter(Column.id == column_id).first()
            if not col:
                return None
            new_task = Task(
                title=title,
                column_id=column_id,
                assigned_to=assigned_to
            )
            session.add(new_task)
            session.commit()
            session.refresh(new_task)
            return new_task 

    @staticmethod
    def update_task(task_id: int, data: dict):
        """
        Обновляет задачу: простые поля и связи (column_id, assigned_to, labels).
        Нормализует assigned_to (0/invalid -> None) и проверяет существование column.
        """
        with session_factory() as session:
            task = session.query(Task).filter(Task.id == task_id).first()
            if not task:
                return None

            # Проверить column_id если передан
            if "column_id" in data and data["column_id"] is not None:
                col = session.query(Column).filter(Column.id == int(data["column_id"])).first()
                if not col:
                    # колонка не найдена — считаем запрос некорректным
                    return None

            # Нормализовать assigned_to: не допускать 0 или несуществующего пользователя
            if "assigned_to" in data:
                at = data["assigned_to"]
                if not at:
                    data["assigned_to"] = None
                else:
                    try:
                        at_id = int(at)
                    except Exception:
                        data["assigned_to"] = None
                    else:
                        user = session.query(User).filter(User.id == at_id).first()
                        data["assigned_to"] = user.id if user else None

            # Обновляем простые поля
            updatable_fields = ("title", "description", "common_id", "priority", "due_date", "column_id", "assigned_to")
            for f in updatable_fields:
                if f in data:
                    setattr(task, f, data[f])

            # Обновляем метки (если есть) — выполнять запрос к Label без автосброса,
            # чтобы избежать преждевременного flush с некорректным FK
            if "label_ids" in data and data["label_ids"] is not None:
                label_ids = [int(i) for i in data["label_ids"]] if data["label_ids"] else []
                with session.no_autoflush:
                    labels = session.query(Label).filter(Label.id.in_(label_ids)).all() if label_ids else []
                try:
                    task.labels = labels
                except Exception:
                    pass

            session.add(task)
            session.commit()
            session.refresh(task)
            return task

    @staticmethod
    def update_column_positions(positions: list[dict]):

        """
            Обновляет позиции колонок.
        """

        with session_factory() as session:
            for col_data in positions:
                session.query(Column).filter(Column.id == col_data["id"]).update(
                    {"position": col_data["position"]}
                )
            session.commit()
