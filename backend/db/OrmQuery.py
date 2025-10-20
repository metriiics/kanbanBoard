from sqlalchemy import select, and_
from fastapi import Depends

from core.security import hash_password

from db.database import engine, Base, session_factory
from db.dbstruct import User, Workspace, Project, UserWorkspace
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
            session.commit()
            session.refresh(new_user)
            return new_user 

    @staticmethod
    def create_workspace_for_user(user_id: int, name: str, description: str | None = None) -> Workspace:
        with session_factory() as session:
            # создаём workspace
            workspace = Workspace(name=name, description=description)
            session.add(workspace)
            session.flush()  # получаем workspace.id до коммита

            # создаём связь user ↔ workspace
            link = UserWorkspace(user_id=user_id, workspace_id=workspace.id)
            session.add(link)

            session.commit()
            session.refresh(workspace)
            return workspace
        
    @staticmethod
    def add_user_to_workspace(user_id: int, workspace_id: int): # Привязка пользователя к рабочему пространству
        with session_factory() as session:
            user = session.query(User).filter(User.id == user_id).first()
            workspace = session.query(Workspace).filter(Workspace.id == workspace_id).first()
            if user and workspace:
                user.workspaces.append(workspace)
                session.commit()

    @staticmethod
    def get_workspace_for_user(user_id: int, workspace_id: int) -> Workspace | None:
        with session_factory() as session:
            stmt = select(Workspace).join(UserWorkspace).where(
                and_(
                    UserWorkspace.user_id == user_id,
                    UserWorkspace.workspace_id == workspace_id
                )
            )
            result = session.execute(stmt).scalars().first()
            return result


    @staticmethod
    def create_project(title: str | None, workspaces_id: int) -> Project:
        with session_factory() as session:
            new_project = Project(title=title, workspaces_id=workspaces_id)
            session.add(new_project)
            session.commit()
            session.refresh(new_project)
            return new_project
        
    @staticmethod
    def get_projects_for_workspace(user_id: int, workspace_id: int) -> list[Project]:
        with session_factory() as session:
            # Проверяем, что пользователь имеет доступ к рабочему пространству
            stmt = select(Project).join(Workspace).join(UserWorkspace).where(
                and_(
                    UserWorkspace.user_id == user_id,
                    Workspace.id == workspace_id,
                    Project.workspaces_id == workspace_id
                )
            )
            result = session.execute(stmt).scalars().all()
            return result