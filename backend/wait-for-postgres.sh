#!/bin/sh
# wait-for-postgres.sh
set -e

host="$1"
shift

# Если пароль берется из файла секрета
if [ -f "/run/secrets/db_pass" ]; then
  export DB_PASS=$(cat /run/secrets/db_pass)
fi

until PGPASSWORD="$DB_PASS" psql -h "$host" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "Waiting for Postgres at $host:5432..."
  sleep 1
done

exec "$@"
