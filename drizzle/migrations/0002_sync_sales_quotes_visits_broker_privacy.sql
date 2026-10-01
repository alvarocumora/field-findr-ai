create table if not exists public.sales_quotes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  lot_id uuid not null references public.lots(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  currency text not null default 'CLP',
  list_price numeric not null check (list_price >= 0),
  discount_amount numeric not null default 0 check (discount_amount >= 0),
  quoted_price numeric not null check (quoted_price >= 0),
  valid_until timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'expired', 'cancelled')),
  sent_at timestamptz,
  accepted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_quotes_discount_lte_list check (discount_amount <= list_price),
  constraint sales_quotes_total_consistent check (quoted_price = list_price - discount_amount)
);
grant select, insert, update, delete on public.sales_quotes to authenticated;
grant all on public.sales_quotes to service_role;
create index if not exists sales_quotes_agent_created_idx on public.sales_quotes(agent_id, created_at desc);
create index if not exists sales_quotes_project_created_idx on public.sales_quotes(project_id, created_at desc);
create index if not exists sales_quotes_lot_idx on public.sales_quotes(lot_id);
create index if not exists sales_quotes_status_idx on public.sales_quotes(status);
alter table public.sales_quotes enable row level security;
drop policy if exists "Agents can create own quotes" on public.sales_quotes;
create policy "Agents can create own quotes" on public.sales_quotes for insert to authenticated
  with check (agent_id = auth.uid() and exists (select 1 from public.lots l where l.id = sales_quotes.lot_id and l.project_id = sales_quotes.project_id and public.same_organization(l.user_id)));
drop policy if exists "Team can view org quotes" on public.sales_quotes;
create policy "Team can view org quotes" on public.sales_quotes for select to authenticated using (public.same_organization(agent_id));
drop policy if exists "Agents can update own quotes" on public.sales_quotes;
create policy "Agents can update own quotes" on public.sales_quotes for update to authenticated using (agent_id = auth.uid()) with check (agent_id = auth.uid());
drop policy if exists "Agents can delete own draft quotes" on public.sales_quotes;
create policy "Agents can delete own draft quotes" on public.sales_quotes for delete to authenticated using (agent_id = auth.uid() and status = 'draft');
drop trigger if exists trg_sales_quotes_updated_at on public.sales_quotes;
create trigger trg_sales_quotes_updated_at before update on public.sales_quotes for each row execute function public.update_updated_at_column();

alter table public.visits
  add column if not exists lot_id uuid references public.lots(id) on delete set null,
  add column if not exists outcome text,
  add column if not exists result_notes text,
  add column if not exists next_action text,
  add column if not exists follow_up_at timestamptz,
  add column if not exists completed_at timestamptz;
alter table public.visits drop constraint if exists visits_outcome_check;
alter table public.visits add constraint visits_outcome_check check (outcome is null or outcome in ('interested', 'needs_follow_up', 'not_interested', 'reserved', 'other')) not valid;
alter table public.visits drop constraint if exists visits_next_action_check;
alter table public.visits add constraint visits_next_action_check check (next_action is null or next_action in ('quote', 'reserve', 'follow_up', 'reschedule', 'close', 'none'));
create index if not exists idx_visits_lot_id on public.visits(lot_id);
create index if not exists idx_visits_follow_up_at on public.visits(follow_up_at) where follow_up_at is not null;

ALTER TABLE public.broker_profiles
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS public_contact_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;
DROP POLICY IF EXISTS "Public can view active public broker profiles" ON public.broker_profiles;
REVOKE SELECT ON public.broker_profiles FROM anon;
CREATE OR REPLACE FUNCTION public.get_public_broker_profile(p_slug text)
RETURNS TABLE(slug text, display_name text, company_name text, bio text, avatar_url text, level text, zones text[], specialties text[], is_verified boolean, phone text, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT bp.slug, bp.display_name, bp.company_name, bp.bio, bp.avatar_url, bp.level, bp.zones, bp.specialties,
    bp.verified_at IS NOT NULL,
    CASE WHEN bp.public_contact_opt_in THEN bp.phone ELSE NULL END,
    CASE WHEN bp.public_contact_opt_in THEN bp.email ELSE NULL END
  FROM public.broker_profiles bp WHERE bp.slug = p_slug AND bp.is_active AND bp.is_public LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_broker_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_broker_profile(text) TO anon, authenticated;