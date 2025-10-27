from sqlalchemy import Integer, String, Boolean, ForeignKey, Column, DateTime, Text, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional, List
from datetime import datetime

from db.database import Base

class User(Base):
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    workspaces: Mapped[List["Workspace"]] = relationship("Workspace", secondary="user_workspaces", back_populates="users")
    comments: Mapped[List["Comment"]] = relationship(back_populates="user")
    assigned_tasks: Mapped[List["Task"]] = relationship(foreign_keys="Task.assigned_to", back_populates="assignee")

class Workspace(Base):
    __tablename__ = 'workspaces'
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    users: Mapped[List["User"]] = relationship("User", secondary="user_workspaces", back_populates="workspaces")
    projects: Mapped[List["Project"]] = relationship(back_populates="workspace")
    labels: Mapped[List["Label"]] = relationship(back_populates="workspace")

class Project(Base):
    __tablename__ = 'projects'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    workspaces_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    workspace: Mapped["Workspace"] = relationship(back_populates="projects")
    boards: Mapped[List["Board"]] = relationship(back_populates="project")

class Board(Base):
    __tablename__ = 'boards'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    projects_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    project: Mapped["Project"] = relationship(back_populates="boards")
    columns: Mapped[List["Column"]] = relationship(back_populates="board")

class Column(Base):
    __tablename__ = 'columns'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    position: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("boards.id"))
    
    board: Mapped["Board"] = relationship(back_populates="columns")
    tasks: Mapped[List["Task"]] = relationship(back_populates="column")

class Task(Base):
    __tablename__ = 'tasks'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    common_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    assigned_to: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    priority: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    column_id: Mapped[int] = mapped_column(ForeignKey("columns.id"))
    
    assignee: Mapped["User"] = relationship(foreign_keys=[assigned_to], back_populates="assigned_tasks")
    column: Mapped["Column"] = relationship(back_populates="tasks")
    comments: Mapped[List["Comment"]] = relationship(back_populates="task")
    labels: Mapped[List["Label"]] = relationship("Label", secondary="task_labels", back_populates="tasks")


class TaskLabel(Base):
    __tablename__ = 'task_labels'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))
    label_id: Mapped[int] = mapped_column(ForeignKey("labels.id"))

class UserWorkspace(Base):
    __tablename__ = 'user_workspaces'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id"))

class Comment(Base):
    __tablename__ = 'comments'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    task: Mapped["Task"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="comments")

class Label(Base):
    __tablename__ = 'labels'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id"))
    
    workspace: Mapped["Workspace"] = relationship(back_populates="labels")
    tasks: Mapped[List["Task"]] = relationship("Task", secondary="task_labels", back_populates="labels")