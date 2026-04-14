#!/bin/bash
set -e

echo "Setting up test database..."

docker-compose -f docker-compose.test.yml up -d postgres redis

echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker-compose -f docker-compose.test.yml exec -T postgres pg_isready -U postgres -d kubegram_test > /dev/null 2>&1; then
    echo "PostgreSQL is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "PostgreSQL failed to start"
    exit 1
  fi
  sleep 1
done

echo "Waiting for Redis to be ready..."
for i in {1..10}; do
  if docker-compose -f docker-compose.test.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "Redis is ready!"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "Redis failed to start"
    exit 1
  fi
  sleep 1
done

echo "Loading schema..."
docker-compose -f docker-compose.test.yml exec -T postgres psql -U postgres -d kubegram_test -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

for fixture in test/fixtures/*.sql; do
  echo "Loading $fixture..."
  docker-compose -f docker-compose.test.yml exec -T postgres psql -U postgres -d kubegram_test -f "/docker-entrypoint-initdb.d/../../../$fixture" 2>/dev/null || true
done

echo "Test database setup complete!"
