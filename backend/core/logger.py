from loguru import logger
import sys
from pathlib import Path

# Путь к папке для логов
LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Основной конфиг логгера
logger.remove()  # убираем стандартный хэндлер
logger.add(sys.stdout, level="INFO", format="<green>{time}</green> | <level>{level}</level> | <cyan>{message}</cyan>")
logger.add(
    LOG_DIR / "app.log",
    rotation="10 MB",        # новый файл каждые 10 МБ
    retention="10 days",     # хранить 10 дней
    compression="zip",       # старые архивировать
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
)

__all__ = ["logger"]
