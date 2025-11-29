from sqlalchemy import select, and_
from fastapi import Depends

from core.security import hash_password
from core.avatar_generator import generate_avatar

from db.database import engine, Base, session_factory
from db.dbstruct import User, Workspace, Project, Board, Column, Task, UserWorkspace, Comment, Label, ColorPalette, WorkspaceInvite, UserProjectAccess
from api.models.user import UserCreate
from api.models.projects import ProjectCreate
from api.models.boards import BoardCreate

from typing import Optional

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
    def get_user_by_username(username: str) -> User | None:

        '''
        Возвращает пользователя по его username.
        '''

        with session_factory() as session:
            return session.query(User).filter(User.username == username).first()
    
    @staticmethod
    def create_user(user: UserCreate, avatar_url: Optional[str] = None) -> User:

        '''
        Создает нового пользователя.
        '''

        with session_factory() as session:
            avatar_path = generate_avatar(user.first_name, user.last_name)
            avatar_url = f"http://localhost:8000/{avatar_path}"

            new_user = User(
                email=user.email,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                password=hash_password(user.password),
                avatar_url=avatar_url
            )
            session.add(new_user)
            session.flush()  # получаем new_user.id

            # создаём дефолтный воркспейс и связываем с пользователем
            ws_name = user.username if user.username else "Workspace"
            new_workspace = Workspace(
                name=ws_name,
                description="Рабочее пространство созданное по умолчанию"
            )
            session.add(new_workspace)
            session.flush()  # получаем new_workspace.id

            # создаём связь с ролями владельца, чтобы пользователь мог управлять workspace
            owner_link = UserWorkspace(
                user_id=new_user.id,
                workspace_id=new_workspace.id,
                role="owner",
                can_invite_users=True,
                can_create_projects=True
            )
            session.add(owner_link)

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
                    joinedload(Column.tasks)  # подгружаем задачи колонки
                        .joinedload(Task.assignee),
                    joinedload(Column.tasks)
                        .joinedload(Task.labels),
                    joinedload(Column.board).joinedload(Board.project),
                    joinedload(Column.color) 
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

    @staticmethod
    def get_project_by_id(projects_id: int):
        """
        Возвращает проект по его ID.
        """
        with session_factory() as session:
            project = session.query(Project).filter(Project.id == projects_id).first()
            return project


    @staticmethod
    def create_project(project: ProjectCreate):
        """
        Создает новый проект.
        """
        with session_factory() as session:
            new_project = Project(
                title=project.title,
                workspaces_id=project.workspaces_id
            )
            session.add(new_project)
            session.commit()
            session.refresh(new_project)
            return new_project

    @staticmethod
    def update_project_title(project_id: int, new_title: str):
        """
        Обновляет название проекта.
        """
        with session_factory() as session:
            project = session.query(Project).filter(Project.id == project_id).first()
            if not project:
                return None
            project.title = new_title
            session.commit()
            session.refresh(project)
            return project

    @staticmethod
    def create_board(board: BoardCreate):
        """
        Создает доску и добавляет стандартные колонки.
        """
        with session_factory() as session:
            # Создаем доску
            new_board = Board(
                title=board.title,
                projects_id=board.projects_id,
            )
            session.add(new_board)
            session.flush()  # получаем new_board.id

            # Добавляем стандартные колонки
            default_columns = ["Open", "Progress", "Review", "Done", "Backlog"]
            for idx, col_title in enumerate(default_columns):
                session.add(Column(title=col_title, board_id=new_board.id, position=idx, color_id=1))

            session.commit()
            session.refresh(new_board)
            return new_board
        
    @staticmethod
    def update_board_title(board_id: int, new_title: str):
        """
        Обновляет название доски.
        """
        with session_factory() as session:
            board = session.query(Board).filter(Board.id == board_id).first()
            if not board:
                return None
            board.title = new_title
            session.commit()
            session.refresh(board)
            return board
        
    @classmethod
    def get_available_colors(cls):
        with session_factory() as session:
            return session.query(ColorPalette).filter_by(is_active=True).all()
        
    @classmethod
    def get_column_by_id(cls, column_id: int):
        """Получить колонку по ID"""
        with session_factory() as session:
            return session.query(Column).filter(Column.id == column_id).first()

    @classmethod
    def get_color_by_id(cls, color_id: int):
        """Получить цвет по ID"""
        with session_factory() as session:
            return session.query(ColorPalette).filter(ColorPalette.id == color_id).first()

    @classmethod
    def update_column_color(cls, column_id: int, color_id: int):
        """Обновить цвет колонки"""
        with session_factory() as session:
            column = session.query(Column).filter(Column.id == column_id).first()
            if column:
                column.color_id = color_id
                session.commit()
                session.refresh(column)
                # Загружаем связанные данные цвета
                column.color
            return column
        
    @staticmethod
    def update_column_title(column_id: int, new_title: str):
        """
        Обновляет название колонки.
        """
        with session_factory() as session:
            column = session.query(Column).filter(Column.id == column_id).first()
            if not column:
                return None
            column.title = new_title
            session.commit()
            session.refresh(column)
            return column
        
    @staticmethod
    def create_column(board_id: int, title: str, position: int, color_id: int = 1):
        """
        Создает новую колонку в доске.
        Всегда устанавливает color_id == 1.
        """
        with session_factory() as session:
            if session.get(Board, board_id) is None:
                return None

            new_column = Column(
                title=title,
                board_id=board_id,
                position=position,
                color_id=1,  # жёстко — всегда 1
            )
            session.add(new_column)
            session.commit()
            session.refresh(new_column)
            return new_column
        
    @staticmethod
    def accept_invite(token: str, user_id: int):
        """
        Принимает приглашение по токену и связывает пользователя с воркспейсом.
        Возвращает:
         - {"status":"ok", "link": UserWorkspace} при успешном добавлении
         - {"status":"already_member", "workspace_id": ..., "user_workspace_id": ...} если пользователь уже в воркспейсе
         - None если токен недействителен/неактивен
        """
        # Проверяем токен приглашения
        with session_factory() as session:
            invite = session.query(WorkspaceInvite).filter(
                WorkspaceInvite.token == token,
                WorkspaceInvite.is_active == True
            ).first()
            if not invite:
                return None
            # Проверяем, что пользователь не является уже участником воркспейса
            existing = session.query(UserWorkspace).filter(
                UserWorkspace.user_id == user_id,
                UserWorkspace.workspace_id == invite.workspace_id
            ).first()
            if existing:
                return {
                    "status": "already_member",
                    "workspace_id": existing.workspace_id,
                    "user_workspace_id": existing.id
                }
            # Создаем связь пользователя с воркспейсом
            link = UserWorkspace(
                user_id=user_id,
                workspace_id=invite.workspace_id,
                role="member"
            )
            session.add(link)
            # Обновляем счетчик использований приглашения
            try:
                invite.used_count = (invite.used_count or 0) + 1
            except AttributeError:
                pass

            session.commit()
            session.refresh(link)
            return {"status": "ok", "link": link}

    @staticmethod
    def create_invite(user_id: int) -> WorkspaceInvite | None:
        """
        Создаёт приглашение для воркспейса, связанного с user_id.
        Требует реальный user_id (создателя) — он будет записан в created_by_id (NOT NULL).
        Возвращает созданный WorkspaceInvite или None, если воркспейс не найден.
        """
        import secrets

        with session_factory() as session:
            # Получаем воркспейс пользователя через существующий метод
            workspace = OrmQuery.get_workspace_by_user_id(user_id)
            if workspace is None:
                return None

            # Проверяем, есть ли уже активное приглашение для этого воркспейса
            existing = session.execute(
                select(WorkspaceInvite).where(
                    WorkspaceInvite.workspace_id == workspace.id,
                    WorkspaceInvite.is_active == True
                )
            ).scalars().first()

            if existing:
                return existing

            # Генерация токена
            token = WorkspaceInvite.generate_token()

            # Используем переданный user_id как created_by_id
            created_by_id = int(user_id)

            new_invite = WorkspaceInvite(
                workspace_id=workspace.id,
                token=token,
                created_by_id=created_by_id,
                is_active=True,
                used_count=0,
            )
            session.add(new_invite)
            session.commit()
            session.refresh(new_invite)
            return new_invite

    @staticmethod
    def delete_invite(token: str, user_id: int) -> bool:
        """
        Удаляет (деактивирует) инвайт по токену.
        Проверяет, что пользователь является владельцем workspace.
        Возвращает True при успехе, False если токен не найден или нет прав.
        """
        with session_factory() as session:
            # Находим инвайт
            invite = session.query(WorkspaceInvite).filter(
                WorkspaceInvite.token == token,
                WorkspaceInvite.is_active == True
            ).first()
            
            if not invite:
                return False
            
            # Проверяем права пользователя на workspace
            user_role = OrmQuery.get_user_workspace_role(user_id, invite.workspace_id)
            if user_role != "owner":
                return False
            
            # Деактивируем инвайт
            invite.is_active = False
            session.commit()
            return True

    @staticmethod
    def create_user_project_access(project_id: int, user_id: int, can_edit: bool = False, can_view: bool = True):
        """
        Создать или обновить запись в user_project_accesses.
        Возвращает объект UserProjectAccess или None (если проект/пользователь не найдены).
        """
        with session_factory() as session:
            # Проверяем существование проекта и пользователя
            project = session.query(Project).filter(Project.id == project_id).first()
            user = session.query(User).filter(User.id == user_id).first()
            if not project or not user:
                return None

            existing = session.query(UserProjectAccess).filter(
                UserProjectAccess.project_id == project_id,
                UserProjectAccess.user_id == user_id
            ).first()

            if existing:
                existing.can_edit = can_edit
                existing.can_view = can_view
                session.add(existing)
                session.commit()
                session.refresh(existing)
                return existing

            new_access = UserProjectAccess(
                user_id=user_id,
                project_id=project_id,
                can_edit=can_edit,
                can_view=can_view
            )
            session.add(new_access)
            session.commit()
            session.refresh(new_access)
            return new_access

    @staticmethod
    def get_users_project_access(project_id: int):
        """
        Получить все записи доступа к проекту по project_id.
        """
        with session_factory() as session:
            accesses = session.query(UserProjectAccess).filter(
                UserProjectAccess.project_id == project_id
            ).all()
            return accesses

    @staticmethod
    def get_user_workspace_role(user_id: int, workspace_id: int) -> str | None:
        """
        Получить роль пользователя в workspace.
        Возвращает роль ('owner', 'admin', 'member', 'guest') или None, если связь не найдена.
        """
        with session_factory() as session:
            user_workspace = session.query(UserWorkspace).filter(
                UserWorkspace.user_id == user_id,
                UserWorkspace.workspace_id == workspace_id
            ).first()
            return user_workspace.role if user_workspace else None

    @staticmethod
    def delete_project(project_id: int) -> bool:
        """
        Удаляет проект по его ID вместе со всеми связанными сущностями:
        - Досками (boards)
        - Колонками (columns)
        - Задачами (tasks) 
        - Правами доступа (user_project_accesses)
        
        Возвращает True, если проект был удален, False, если проект не найден.
        """
        with session_factory() as session:
            project = session.query(Project).filter(Project.id == project_id).first()
            if not project:
                return False
            
            # Получаем все доски проекта
            boards = session.query(Board).filter(Board.projects_id == project_id).all()
            
            for board in boards:
                # Получаем все колонки доски
                columns = session.query(Column).filter(Column.board_id == board.id).all()
                
                for column in columns:
                    # Удаляем все задачи колонки
                    session.query(Task).filter(Task.column_id == column.id).delete()
                
                # Удаляем все колонки доски
                session.query(Column).filter(Column.board_id == board.id).delete()
            
            # Удаляем все доски проекта
            session.query(Board).filter(Board.projects_id == project_id).delete()
            
            # Удаляем все права доступа к проекту
            session.query(UserProjectAccess).filter(UserProjectAccess.project_id == project_id).delete()
            
            # Удаляем сам проект
            session.delete(project)
            session.commit()
            return True

    @staticmethod
    def delete_board(board_id: int) -> bool:
        """
        Удаляет доску по её ID вместе со всеми связанными сущностями:
        - Колонками (columns)
        - Задачами (tasks)
        
        Возвращает True, если доска была удалена, False, если доска не найдена.
        """
        with session_factory() as session:
            board = session.query(Board).filter(Board.id == board_id).first()
            if not board:
                return False
            
            # Получаем все колонки доски
            columns = session.query(Column).filter(Column.board_id == board_id).all()
            
            for column in columns:
                # Удаляем все задачи колонки
                session.query(Task).filter(Task.column_id == column.id).delete()
            
            # Удаляем все колонки доски
            session.query(Column).filter(Column.board_id == board_id).delete()
            
            # Удаляем саму доску
            session.delete(board)
            session.commit()
            return True

    @staticmethod
    def update_user(user_id: int, first_name: str | None = None, last_name: str | None = None, 
                   username: str | None = None, avatar_file = None) -> User | None:
        """
        Обновляет данные пользователя.
        Если передан avatar_file (UploadFile), сохраняет его и обновляет avatar_url.
        Возвращает обновленного пользователя или None, если пользователь не найден.
        """
        from core.avatar_generator import save_avatar_file
        
        with session_factory() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            
            if first_name is not None:
                user.first_name = first_name
            if last_name is not None:
                user.last_name = last_name
            if username is not None:
                user.username = username
            
            # Обработка аватарки
            if avatar_file is not None:
                old_avatar_url = user.avatar_url
                new_avatar_url = save_avatar_file(avatar_file, old_avatar_url)
                user.avatar_url = new_avatar_url
            
            session.commit()
            session.refresh(user)
            return user

    @staticmethod
    def create_comment(task_id: int, user_id: int, content: str) -> Comment | None:
        """
        Создаёт комментарий к задаче.
        Возвращает объект Comment или None, если задача не найдена.
        """
        with session_factory() as session:
            task = session.query(Task).filter(Task.id == task_id).first()
            if not task:
                return None
            
            new_comment = Comment(
                task_id=task_id,
                user_id=user_id,
                content=content
            )
            session.add(new_comment)
            session.commit()
            session.refresh(new_comment)
            return new_comment

    @staticmethod
    def create_label(workspace_id: int, name: str, color: str | None = None) -> Label | None:
        """
        Создаёт новый тег в рабочем пространстве.
        Возвращает объект Label или None, если пространство не найдено.
        """
        with session_factory() as session:
            workspace = session.query(Workspace).filter(Workspace.id == workspace_id).first()
            if not workspace:
                return None
            
            new_label = Label(
                workspace_id=workspace_id,
                name=name,
                color=color or "#d1d5db"
            )
            session.add(new_label)
            session.commit()
            session.refresh(new_label)
            return new_label