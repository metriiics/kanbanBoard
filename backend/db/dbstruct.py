from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional


from app.db.database import Base

class UserOrm(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(unique=True)
    hashed_password: Mapped[str] = mapped_column()

    tasks: Mapped["TaskOrm"] = relationship(back_populates="owner")