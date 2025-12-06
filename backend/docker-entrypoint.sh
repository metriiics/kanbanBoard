#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "Applying database migrations..."
    alembic upgrade head
else
    echo "Skipping database migrations (RUN_MIGRATIONS=${RUN_MIGRATIONS})"
fi

echo "Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"

