-- Minimal Supabase-like environment to functionally test the migrations.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('test.uid', true), '')::uuid $$;

CREATE TYPE reservation_status AS ENUM ('pending_payment', 'paid', 'expired', 'cancelled', 'converted');

CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  name text
);

CREATE TABLE public.lots (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id),
  user_id uuid NOT NULL,
  lot_number text,
  area numeric,
  price numeric,
  price_per_sqm numeric,
  status text DEFAULT 'available',
  sale_date timestamptz
);

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY,
  lot_id uuid REFERENCES public.lots(id),
  user_id uuid NOT NULL,
  buyer_name text,
  reservation_amount numeric DEFAULT 500000,
  status reservation_status DEFAULT 'pending_payment',
  expires_at timestamptz,
  converted_at timestamptz,
  notes text,
  contract_id text
);

CREATE TABLE public.agent_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  reservation_id uuid,
  lot_id uuid,
  project_id uuid,
  sale_amount numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 3.0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
