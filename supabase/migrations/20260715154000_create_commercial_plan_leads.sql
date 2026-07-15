-- Commercial plan leads for loteo management plans.
-- Captures selected plan, source and buyer contact data from public sales forms.

create table if not exists public.commercial_plan_leads (
  id uuid primary key default gen_random_uuid(),
  plan_slug text not null,
  source text,
  company_name text,
  contact_name text,
  email text not null,
  phone text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_commercial_plan_leads_status
  on public.commercial_plan_leads(status);

create index if not exists idx_commercial_plan_leads_plan_slug
  on public.commercial_plan_leads(plan_slug);

create index if not exists idx_commercial_plan_leads_created_at
  on public.commercial_plan_leads(created_at desc);

alter table public.commercial_plan_leads enable row level security;

-- Public site visitors can submit plan leads.
create policy "Public can create commercial plan leads"
  on public.commercial_plan_leads
  for insert
  with check (true);

-- Platform admins can read all commercial leads.
create policy "Admins can read commercial plan leads"
  on public.commercial_plan_leads
  for select
  using (public.is_platform_admin());

-- Platform admins can update lead status and notes later.
create policy "Admins can update commercial plan leads"
  on public.commercial_plan_leads
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create or replace function public.set_commercial_plan_leads_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_commercial_plan_leads_updated_at on public.commercial_plan_leads;

create trigger set_commercial_plan_leads_updated_at
before update on public.commercial_plan_leads
for each row
execute function public.set_commercial_plan_leads_updated_at();
