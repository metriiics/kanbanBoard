"""add created_by to tasks

Revision ID: add_created_by_to_tasks
Revises: c10ef9948cbc
Create Date: 2025-01-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_created_by_to_tasks'
down_revision: Union[str, Sequence[str], None] = 'c10ef9948cbc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Добавляем колонку created_by как NULLABLE
    op.add_column('tasks', sa.Column('created_by', sa.Integer(), nullable=True))
    
    # Создаем foreign key
    op.create_foreign_key(
        'fk_tasks_created_by_users',
        'tasks', 'users',
        ['created_by'], ['id']
    )


def downgrade() -> None:
    # Удаляем foreign key
    op.drop_constraint('fk_tasks_created_by_users', 'tasks', type_='foreignkey')
    
    # Удаляем колонку
    op.drop_column('tasks', 'created_by')

