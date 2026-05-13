-- Visual Scenarios persistence foundation
-- Sprint 4: creates visual_scenarios table with basic RLS policies.

create table if not exists public.visual_scenarios (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.listings(id) on delete cascade,
  scenario_type text not null check (
    scenario_type in (
      'industrial_packing',
      'warehouse_logistics',
      'residential_subdivision',
      'rural_lots',
      'agricultural_productive',
      'solar_energy',
      'tourism_lodge',
      'mixed_use'
    )
  ),
  status text not null default 'draft' check (
    status in ('draft', 'concept', 'review', 'approved', 'archived')
  ),
  title text not null,
  subtitle text,
  description text,
  base_image_url text,
  overlay_image_url text,
  thumbnail_url text,
  model_registry_keys text[],
  property_geojson jsonb,
  scenario_geojson jsonb,
  map_center_lng double precision,
  map_center_lat double precision,
  map_bearing double precision,
  map_pitch double precision,
  map_zoom double precision,
  metrics jsonb default '[]'::jsonb,
  assumptions jsonb default '[]'::jsonb,
  risks jsonb default '[]'::jsonb,
  tags text[] default '{}',
  estimated_capex numeric,
  estimated_revenue numeric,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visual_scenarios_property_id
  on public.visual_scenarios(property_id);

create index if not exists idx_visual_scenarios_status
  on public.visual_scenarios(status);

create index if not exists idx_visual_scenarios_type
  on public.visual_scenarios(scenario_type);

alter table public.visual_scenarios enable row level security;

-- Public users may read public-ready scenarios associated with active listings.
create policy "Public can read public visual scenarios"
  on public.visual_scenarios
  for select
  using (
    status in ('concept', 'approved')
    and exists (
      select 1
      from public.listings l
      where l.id = visual_scenarios.property_id
        and l.status = 'active'
    )
  );

-- Listing owners may read all scenarios for their own listings.
create policy "Listing owners can read own visual scenarios"
  on public.visual_scenarios
  for select
  using (
    exists (
      select 1
      from public.listings l
      where l.id = visual_scenarios.property_id
        and l.user_id = auth.uid()
    )
  );

-- Listing owners may create scenarios for their own listings.
create policy "Listing owners can create visual scenarios"
  on public.visual_scenarios
  for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.listings l
      where l.id = visual_scenarios.property_id
        and l.user_id = auth.uid()
    )
  );

-- Listing owners may update scenarios for their own listings.
create policy "Listing owners can update own visual scenarios"
  on public.visual_scenarios
  for update
  using (
    exists (
      select 1
      from public.listings l
      where l.id = visual_scenarios.property_id
        and l.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = visual_scenarios.property_id
        and l.user_id = auth.uid()
    )
  );

-- Listing owners may delete scenarios for their own listings.
create policy "Listing owners can delete own visual scenarios"
  on public.visual_scenarios
  for delete
  using (
    exists (
      select 1
      from public.listings l
      where l.id = visual_scenarios.property_id
        and l.user_id = auth.uid()
    )
  );

-- Keep updated_at fresh.
create or replace function public.set_visual_scenarios_updated_at()
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

drop trigger if exists set_visual_scenarios_updated_at on public.visual_scenarios;

create trigger set_visual_scenarios_updated_at
before update on public.visual_scenarios
for each row
execute function public.set_visual_scenarios_updated_at();
