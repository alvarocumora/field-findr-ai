#!/usr/bin/env bash
# Disposable local database only: no host ports, external network or DB secrets.
set -euo pipefail
cd "$(dirname "$0")/.."
container_name="fieldfindr-auth-test-${RANDOM}-$$"
container_id=$(docker run --rm -d --network none --name "$container_name" -e POSTGRES_HOST_AUTH_METHOD=trust postgres:16-alpine)
trap 'docker rm -f "$container_id" >/dev/null 2>&1 || true' EXIT
ready=false
# The image runs a temporary socket-only server during initdb and then restarts
# it: pg_isready can succeed against that temporary server and psql then fails
# mid-restart. Wait for the init-complete marker, then for a real query.
for attempt in {1..60}; do
  if docker logs "$container_id" 2>&1 | grep -q 'PostgreSQL init process complete' \
     && docker exec "$container_id" psql -X -U postgres -tAc 'select 1' >/dev/null 2>&1; then
    ready=true; break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then docker logs "$container_id"; exit 1; fi
docker exec "$container_id" mkdir -p /tmp/auth-regression/supabase/tests /tmp/auth-regression/supabase/migrations
for source in \
  supabase/tests/auth_signup_roles.test.sql \
  supabase/migrations/20260213112738_d3caed97-36eb-4393-9071-4f54af199aaf.sql \
  supabase/migrations/20261030010000_restrict_public_signup_roles.sql; do
  docker cp "$source" "$container_id:/tmp/auth-regression/$source" >/dev/null
done
docker exec "$container_id" psql -X -U postgres -v ON_ERROR_STOP=1 -f /tmp/auth-regression/supabase/tests/auth_signup_roles.test.sql
