#!/usr/bin/env bash
# Functional tests for the loteo RPC migrations against a scratch PostgreSQL.
# Usage: ./run.sh <psql-connection-args...>   e.g. ./run.sh -h localhost -p 5432 -U postgres
# Creates a throwaway "miglab" database, replays a minimal Supabase-like stub
# (auth.uid(), roles, core tables), applies the two loteo migrations and runs
# the assertions in loteo_rpcs.test.sql. Exits non-zero on any failure.
set -euo pipefail
cd "$(dirname "$0")/../.."

psql "$@" -c "DROP DATABASE IF EXISTS miglab;" -c "CREATE DATABASE miglab;"
psql "$@" <<'SQL'
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SQL
psql "$@" -d miglab -v ON_ERROR_STOP=1 \
  -f supabase/tests/stub_env.sql \
  -f supabase/migrations/20260705210000_loteo_sales_tools.sql \
  -f supabase/migrations/20260705220000_mark_commission_paid.sql \
  -f supabase/tests/loteo_rpcs.test.sql \
  -f supabase/tests/stub_payments.sql \
  -f supabase/migrations/20260706120000_payment_gateway_hardening.sql \
  -f supabase/tests/payment_hardening.test.sql

# Lots public-read contract (RLS + column grants) — self-contained on its own DB.
psql "$@" -c "DROP DATABASE IF EXISTS lotslab;" -c "CREATE DATABASE lotslab;"
psql "$@" -d lotslab -v ON_ERROR_STOP=1 -f supabase/tests/lots_public_read.test.sql
