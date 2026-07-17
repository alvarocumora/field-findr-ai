-- ============================================================
-- Fase 3 — Scoping operativo por organización.
-- 1) same_organization(uuid): ¿ese usuario es de mi mismo equipo?
-- 2) Políticas RLS de SOLO LECTURA para el equipo: listings, lots,
--    leads, projects y reservations de compañeros de organización.
--    La escritura sigue siendo del dueño de cada fila.
-- 3) projects.organization_id: auto-asignación al crear + backfill.
-- Idempotente: seguro re-ejecutar.
-- ============================================================

-- 1) Helper: mismo equipo (dueño o miembro de alguna organización en común).
--    SECURITY DEFINER para leer organizations/organization_members sin
--    recursión de RLS. Se usa DENTRO de políticas RLS, por lo que DEBE
--    tener EXECUTE para authenticated (ver incidente con has_role).
create or replace function public.same_organization(_other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select _other is not null and auth.uid() is not null and (
    _other = auth.uid()
    or exists (
      select 1
      from (
        select o.id from public.organizations o where o.owner_id = auth.uid()
        union
        select m.organization_id from public.organization_members m where m.user_id = auth.uid()
      ) mine
      where mine.id in (
        select o2.id from public.organizations o2 where o2.owner_id = _other
        union
        select m2.organization_id from public.organization_members m2 where m2.user_id = _other
      )
    )
  );
$$;

grant execute on function public.same_organization(uuid) to authenticated;

-- 2) Políticas de lectura del equipo (TO authenticated: anon nunca las evalúa).
drop policy if exists "Team can view org listings" on public.listings;
create policy "Team can view org listings"
  on public.listings for select
  to authenticated
  using (public.same_organization(user_id));

drop policy if exists "Team can view org lots" on public.lots;
create policy "Team can view org lots"
  on public.lots for select
  to authenticated
  using (public.same_organization(user_id));

drop policy if exists "Team can view org leads" on public.leads;
create policy "Team can view org leads"
  on public.leads for select
  to authenticated
  using (public.same_organization(user_id));

drop policy if exists "Team can view org projects" on public.projects;
create policy "Team can view org projects"
  on public.projects for select
  to authenticated
  using (public.same_organization(user_id));

drop policy if exists "Team can view org reservations" on public.reservations;
create policy "Team can view org reservations"
  on public.reservations for select
  to authenticated
  using (
    exists (
      select 1 from public.lots l
      where l.id = reservations.lot_id
        and public.same_organization(l.user_id)
    )
  );

-- 3) projects.organization_id: auto-asignar al crear según la organización
--    del creador (propia primero, si no la primera membresía).
create or replace function public.assign_project_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id is null then
    new.organization_id := coalesce(
      (select o.id from public.organizations o
        where o.owner_id = new.user_id
        order by o.created_at limit 1),
      (select m.organization_id from public.organization_members m
        where m.user_id = new.user_id
        order by m.created_at limit 1)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_project_organization on public.projects;
create trigger trg_assign_project_organization
  before insert on public.projects
  for each row
  execute function public.assign_project_organization();

-- Backfill de proyectos existentes sin organización.
update public.projects p
set organization_id = coalesce(
  (select o.id from public.organizations o
    where o.owner_id = p.user_id
    order by o.created_at limit 1),
  (select m.organization_id from public.organization_members m
    where m.user_id = p.user_id
    order by m.created_at limit 1)
)
where p.organization_id is null;
