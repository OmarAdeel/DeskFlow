#!/bin/sh
set -eu

DB_NAME="${DB_NAME:-deskflow_local}"
DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DB_USER="${PGUSER:-$(id -un)}"
PSQL="psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER""
CREATEDB="createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER""

if ! $PSQL -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q '^1$'; then
  echo "Creating local PostgreSQL database: $DB_NAME"
  $CREATEDB "$DB_NAME"
else
  echo "Using existing local PostgreSQL database: $DB_NAME"
fi

echo "Applying schema..."
$PSQL -d "$DB_NAME" -f src/db/schema.sql >/dev/null

echo "Seeding all schema tables with demo data..."
$PSQL -d "$DB_NAME" -f scripts/seed-local-db.sql >/dev/null

echo "Local database ready: postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
