"""Скрипт для применения миграции Alembic"""
import sys
from pathlib import Path

# Добавляем текущую директорию в путь
sys.path.insert(0, str(Path(__file__).parent))

from alembic.config import Config
from alembic import command

if __name__ == "__main__":
    # Создаем конфигурацию Alembic
    alembic_cfg = Config("alembic.ini")
    
    # Применяем миграции до последней версии
    print("Применяю миграции Alembic...")
    command.upgrade(alembic_cfg, "head")
    print("Миграции успешно применены!")

