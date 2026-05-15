-- Visual Scenarios admin RLS policies
-- Sprint 4.3: allow platform admins to manage all visual scenarios.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  );
$$;

-- Admins can read all scenarios, including draft/review/archived.
create policy "Admins can read all visual scenarios"
  on public.visual_scenarios
  for select
  using (public.is_platform_admin());

-- Admins can create scenarios for any listing.
create policy "Admins can create visual scenarios"
  on public.visual_scenarios
  for insert
  with check (public.is_platform_admin());

-- Admins can update any scenario.
create policy "Admins can update visual scenarios"
  on public.visual_scenarios
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Admins can delete any scenario.
create policy "Admins can delete visual scenarios"
  on public.visual_scenarios
  for delete
  using (public.is_platform_admin());
