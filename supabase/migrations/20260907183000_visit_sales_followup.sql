-- Sales Executive OS: resultado de visita y siguiente acción comercial.
-- Mantiene la tabla visits existente y agrega campos operativos sin cambiar su RLS actual.

alter table public.visits
  add column if not exists lot_id uuid references public.lots(id) on delete set null,
  add column if not exists outcome text,
  add column if not exists result_notes text,
  add column if not exists next_action text,
  add column if not exists follow_up_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.visits
  drop constraint if exists visits_outcome_check;
alter table public.visits
  add constraint visits_outcome_check
  check (outcome is null or outcome in ('interested', 'needs_follow_up', 'not_interested', 'reserved', 'other'));

alter table public.visits
  drop constraint if exists visits_next_action_check;
alter table public.visits
  add constraint visits_next_action_check
  check (next_action is null or next_action in ('quote', 'reserve', 'follow_up', 'reschedule', 'close', 'none'));

create index if not exists idx_visits_lot_id on public.visits(lot_id);
create index if not exists idx_visits_follow_up_at on public.visits(follow_up_at) where follow_up_at is not null;

comment on column public.visits.outcome is 'Resultado comercial de la visita.';
comment on column public.visits.next_action is 'Siguiente acción comercial definida por el ejecutivo.';
comment on column public.visits.follow_up_at is 'Fecha/hora comprometida para seguimiento.';
