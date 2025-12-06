# Kanban Board

Полноценный kanban-сервис на FastAPI + React с поддержкой AI-ассистента через Ollama.

## Стек
- `backend` — FastAPI, SQLAlchemy, Alembic.
- `frontend` — React (create-react-app).
- `db` — PostgreSQL 16.
- `ollama` — локальные LLM модели для модуля `api/ai`.
- `nginx` — сервирует фронтенд и проксирует API/статические файлы.

## Быстрый старт (Docker)
1. Скопируйте переменные окружения:
   ```bash
   copy env.example .env   # Windows PowerShell
   # или
   cp env.example .env
   ```
2. (Опционально) отредактируйте `.env` — задайте свои пароли, `SECRET_KEY`, `SALT`, при необходимости укажите `OLLAMA_BASE_URL` и `FRONTEND_URL`.
3. Соберите и запустите стек:
   ```bash
   docker compose up --build -d
   ```
4. Если используете AI-модуль, загрузите нужную модель один раз:
   ```bash
   docker exec -it kanban-ollama ollama pull llama3.2
   ```
5. Приложение будет доступно на `http://localhost:8080`, API — по `http://localhost:8080/api`.

## Контейнеры
- `kanban-frontend` — билд фронтенда + nginx (`deploy/nginx/default.conf`), проксирует `/api` и `/static` к backend.
- `kanban-backend` — FastAPI + Alembic. При старте автоматически применяет миграции (можно отключить `RUN_MIGRATIONS=false`).
- `kanban-postgres` — база данных с постоянным volume `postgres_data`.
- `kanban-ollama` — сервис для работы модуля `api/ai` (volume `ollama_data`). Можно удалить из `docker-compose.yml`, если AI не нужен.

## Полезные команды
- Логи: `docker compose logs -f backend`, `docker compose logs -f frontend`.
- Обновить фронт/бэкенд после изменения кода: `docker compose up --build backend frontend`.
- Остановить стек: `docker compose down`.
- Сбросить данные БД: `docker compose down -v` (удалит volume `postgres_data`).

## Разработка без Docker
Для локального запуска можно использовать существующий Python/Node окружения:
1. Backend: `pip install -r backend/requirements.txt`, затем `uvicorn main:app --reload` (из папки `backend`).
2. Frontend: `cd frontend && npm install && npm start`.
3. PostgreSQL и Ollama поднимаются отдельно (см. `.env` для настроек).