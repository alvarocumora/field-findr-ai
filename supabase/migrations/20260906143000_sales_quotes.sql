-- ============================================================
-- Sales Executive OS — persistent quotations
-- Keeps a commercial snapshot independent from future lot price edits.
-- ============================================================

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

create index if not exists sales_quotes_agent_created_idx on public.sales_quotes(agent_id, created_at desc);
create index if not exists sales_quotes_project_created_idx on public.sales_quotes(project_id, created_at desc);
create index if not exists sales_quotes_lot_idx on public.sales_quotes(lot_id);
create index if not exists sales_quotes_status_idx on public.sales_quotes(status);

alter table public.sales_quotes enable row level security;

drop policy if exists "Agents can create own quotes" on public.sales_quotes;
create policy "Agents can create own quotes"
  on public.sales_quotes for insert
  to authenticated
  with check (
    agent_id = auth.uid()
    and exists (
      select 1 from public.lots l
      where l.id = sales_quotes.lot_id
        and l.project_id = sales_quotes.project_id
        and public.same_organization(l.user_id)
    )
  );

drop policy if exists "Team can view org quotes" on public.sales_quotes;
create policy "Team can view org quotes"
  on public.sales_quotes for select
  to authenticated
  using (public.same_organization(agent_id));

drop policy if exists "Agents can update own quotes" on public.sales_quotes;
create policy "Agents can update own quotes"
  on public.sales_quotes for update
  to authenticated
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

drop policy if exists "Agents can delete own draft quotes" on public.sales_quotes;
create policy "Agents can delete own draft quotes"
  on public.sales_quotes for delete
  to authenticated
  using (agent_id = auth.uid() and status = 'draft');

-- Reuse the project's standard updated_at helper when available.
do $do$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'update_updated_at_column'
  ) then
    execute 'drop trigger if exists trg_sales_quotes_updated_at on public.sales_quotes';
    execute 'create trigger trg_sales_quotes_updated_at before update on public.sales_quotes for each row execute function public.update_updated_at_column()';
  end if;
end;
$do$;
