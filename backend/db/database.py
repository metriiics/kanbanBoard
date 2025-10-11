from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase

from core.config import settings

engine = create_engine(url=settings.DATABASE_URL)

session_factory = sessionmaker(engine)

class Base(DeclarativeBase):
    pass

def get_db() -> Session:
    db = session_factory()
    try:
        yield db
    finally:
        db.close()