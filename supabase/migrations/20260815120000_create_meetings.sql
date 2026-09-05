-- Sistema de agendamiento de reuniones.
-- Página pública /agendar (propietarios de campos y compradores) +
-- gestión en /asesor/reuniones (confirmar con link de Meet/Zoom, completar, cancelar).

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_type text not null default 'reunion_campo'
    check (meeting_type in ('reunion_campo', 'reunion_comercial', 'visita_terreno')),
  requester_name text not null,
  requester_phone text not null,
  requester_email text,
  context text,
  project_id uuid references public.projects(id) on delete set null,
  lot_id uuid references public.lots(id) on delete set null,
  preferred_date date,
  preferred_block text check (preferred_block in ('manana', 'tarde')),
  scheduled_at timestamptz,
  meeting_url text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  assigned_to uuid,
  internal_notes text,
  source text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_meetings_status on public.meetings(status);
create index if not exists idx_meetings_scheduled_at on public.meetings(scheduled_at);
create index if not exists idx_meetings_created_at on public.meetings(created_at desc);

alter table public.meetings enable row level security;

-- Cualquier visitante puede solicitar una reunión desde el sitio público.
drop policy if exists "Public can request meetings" on public.meetings;
create policy "Public can request meetings"
  on public.meetings
  for insert
  with check (true);

-- El equipo (asesores y admins) gestiona la agenda.
drop policy if exists "Team can read meetings" on public.meetings;
create policy "Team can read meetings"
  on public.meetings
  for select
  using (public.has_role(auth.uid(), 'agent') or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Team can update meetings" on public.meetings;
create policy "Team can update meetings"
  on public.meetings
  for update
  using (public.has_role(auth.uid(), 'agent') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'agent') or public.has_role(auth.uid(), 'admin'));

create or replace function public.set_meetings_updated_at()
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

drop trigger if exists set_meetings_updated_at on public.meetings;

create trigger set_meetings_updated_at
before update on public.meetings
for each row
execute function public.set_meetings_updated_at();
