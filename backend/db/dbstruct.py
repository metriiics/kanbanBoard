from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional


from app.db.database import Base

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    first_name = Column(String)
    task_name = Column(String)
    username = Column(String)
    email = Column(String)
    password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    workspaces = relationship("Workspace", secondary=user_workspaces, back_populates="users")
    comments = relationship("Comment", back_populates="user")
    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_to", back_populates="assignee")

class Workspace(Base):
    __tablename__ = 'workspaces'
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    users = relationship("User", secondary=user_workspaces, back_populates="workspaces")
    projects = relationship("Project", back_populates="workspace")
    labels = relationship("Label", back_populates="workspace")

class Project(Base):
    __tablename__ = 'projects'
    
    id = Column(Integer, primary_key=True)
    title = Column(String)
    workspaces_id = Column(Integer, ForeignKey('workspaces.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    workspace = relationship("Workspace", back_populates="projects")
    boards = relationship("Board", back_populates="project")

class Board(Base):
    __tablename__ = 'boards'
    
    id = Column(Integer, primary_key=True)
    title = Column(String)
    projects_id = Column(Integer, ForeignKey('projects.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    project = relationship("Project", back_populates="boards")
    columns = relationship("Column", back_populates="board")

class Column(Base):
    __tablename__ = 'columns'
    
    id = Column(Integer, primary_key=True)
    title = Column(String)
    position = Column(Integer)
    board_id = Column(Integer, ForeignKey('boards.id'))
    
    # Связи
    board = relationship("Board", back_populates="columns")
    tasks = relationship("Task", back_populates="column")

class Task(Base):
    __tablename__ = 'tasks'
    
    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(Text)
    common_id = Column(Integer)  # Непонятное поле, возможно нужно уточнение
    assigned_to = Column(Integer, ForeignKey('USCTS.id'))
    priority = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    column_id = Column(Integer, ForeignKey('columns.id'))
    
    # Связи
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tasks")
    column = relationship("Column", back_populates="tasks")
    comments = relationship("Comment", back_populates="task")
    labels = relationship("Label", secondary=task_labels, back_populates="tasks")

class TaskLabel(Base):
    __tablename__ = 'task_labels'
    
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey('tasks.id'))
    label_id = Column(Integer, ForeignKey('labels.id'))

class UserWorkspace(Base):
    __tablename__ = 'user_workspaces'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('USCTS.id'))
    workspaces_id = Column(Integer, ForeignKey('workspaces.id'))
    test_id = Column(Integer)

class Comment(Base):
    __tablename__ = 'comments'
    
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey('tasks.id'))
    user_id = Column(Integer, ForeignKey('USCTS.id'))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    task = relationship("Task", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Label(Base):
    __tablename__ = 'labels'
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    color = Column(String)
    workspace_id = Column(Integer, ForeignKey('workspaces.id'))
    
    # Связи
    workspace = relationship("Workspace", back_populates="labels")
    tasks = relationship("Task", secondary=task_labels, back_populates="labels")