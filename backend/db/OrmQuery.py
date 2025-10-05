from sqlalchemy import select, and_
from fastapi import Depends

from app.core.security import get_user_by_token
from app.db.database import engine, Base, session_factory
from app.db.dbstruct import UserOrm, TaskOrm
from app.api.models.task import TaskCreate, TaskUpdate

class OrmQuery:
    @staticmethod
    def create_tables():
        Base.metadata.create_all(engine)
    
    @staticmethod
    def insert_data(username: str, email: str, hashed_password: str):
        with session_factory() as session:
            new_user = UserOrm(
                username=username, 
                email=email, 
                hashed_password=hashed_password
            )
            session.add(new_user)
            session.flush()
            session.commit()

