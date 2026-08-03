-- ============================================================
-- R1 — Landing genérica por proyecto (/p/:slug).
-- projects.slug (único) + projects.landing_config (jsonb) para que cada
-- proyecto tenga su landing premium configurable SIN código nuevo: fin de
-- las landings hardcodeadas una por proyecto.
-- Idempotente: seguro re-ejecutar.
-- ============================================================

alter table public.projects add column if not exists slug text;
alter table public.projects add column if not exists landing_config jsonb not null default '{}'::jsonb;

create unique index if not exists idx_projects_slug
  on public.projects (slug) where slug is not null;

-- Slugify sin extensión unaccent: minúsculas, translitera acentos/ñ y
-- colapsa todo lo no alfanumérico a guiones.
create or replace function public.project_slugify(_txt text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    translate(lower(coalesce(_txt, '')),
      'áéíóúüñàèìòù', 'aeiouunaeiou'),
    '[^a-z0-9]+', '-', 'g'))
$$;

-- Backfill: slug desde el nombre; duplicados reciben sufijo -2, -3, …
with base as (
  select id,
         public.project_slugify(name) as s,
         row_number() over (partition by public.project_slugify(name) order by created_at) as rn
  from public.projects
  where slug is null
)
update public.projects p
set slug = case when b.rn = 1 then b.s else b.s || '-' || b.rn end
from base b
where p.id = b.id and b.s <> '';
