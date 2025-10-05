from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase

from app.core.config import settings

engine = create_engine(url=settings.DATABASE_URL)

session_factory = sessionmaker(engine)

class Base(DeclarativeBase):
    pass
