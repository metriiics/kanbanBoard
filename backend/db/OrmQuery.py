from sqlalchemy import select, and_
from fastapi import Depends

from core.security import hash_password

from db.database import engine, Base, session_factory
from db.dbstruct import User
from api.models.user import UserCreate

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

