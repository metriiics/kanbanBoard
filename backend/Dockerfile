FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip \
    && pip install -r /tmp/requirements.txt

COPY backend /app/backend

RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser /app/backend \
    && chmod +x /app/backend/docker-entrypoint.sh

USER appuser

EXPOSE 8000

CMD ["./docker-entrypoint.sh"]

