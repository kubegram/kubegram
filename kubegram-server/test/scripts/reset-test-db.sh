#!/bin/bash
set -e

echo "Resetting test database..."

docker-compose -f docker-compose.test.yml exec -T postgres psql -U postgres -d kubegram_test -c "
DO \$\$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'DELETE FROM ' || quote_ident(r.tablename);
  END LOOP;
END \$\$;
"

for fixture in test/fixtures/*.sql; do
  echo "Loading $fixture..."
  cat "$fixture" | docker-compose -f docker-compose.test.yml exec -T postgres psql -U postgres -d kubegram_test 2>/dev/null || true
done

echo "Test database reset complete!"
