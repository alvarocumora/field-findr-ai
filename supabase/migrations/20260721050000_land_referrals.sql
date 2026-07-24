-- ============================================================
-- Comunidad OT — Fase A: captaciones de terrenos.
-- Un corredor asociado ofrece un terreno de un tercero; la gerencia
-- de OT lo revisa, negocia con el dueño y, si hay acuerdo, lo publica.
-- El corredor queda registrado como captador para su comisión.
-- Idempotente: seguro re-ejecutar.
-- ============================================================

create table if not exists public.land_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  title text not null,
  region text,
  comuna text,
  address text,
  size_m2 numeric,
  expected_price numeric,
  owner_name text not null,
  owner_phone text,
  owner_email text,
  description text,
  links text,
  status text not null default 'nueva'
    check (status in ('nueva', 'en_revision', 'en_negociacion', 'acuerdo_firmado', 'publicada', 'rechazada')),
  admin_notes text,
  listing_id uuid references public.listings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_land_referrals_referrer on public.land_referrals(referrer_id);
create index if not exists idx_land_referrals_status on public.land_referrals(status);

alter table public.land_referrals enable row level security;

-- El corredor crea y ve SOLO sus captaciones; puede editarlas mientras
-- estén en 'nueva' (antes de que gerencia empiece a trabajarlas).
drop policy if exists "Referrers create own captaciones" on public.land_referrals;
create policy "Referrers create own captaciones"
  on public.land_referrals for insert
  to authenticated
  with check (referrer_id = auth.uid());

drop policy if exists "Referrers view own captaciones" on public.land_referrals;
create policy "Referrers view own captaciones"
  on public.land_referrals for select
  to authenticated
  using (referrer_id = auth.uid());

drop policy if exists "Referrers edit own new captaciones" on public.land_referrals;
create policy "Referrers edit own new captaciones"
  on public.land_referrals for update
  to authenticated
  using (referrer_id = auth.uid() and status = 'nueva')
  with check (referrer_id = auth.uid() and status = 'nueva');

-- Gerencia (admins de plataforma) gestiona todo.
drop policy if exists "Admins manage captaciones" on public.land_referrals;
create policy "Admins manage captaciones"
  on public.land_referrals for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- updated_at
create or replace function public.set_land_referrals_updated_at()
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

drop trigger if exists trg_land_referrals_updated_at on public.land_referrals;
create trigger trg_land_referrals_updated_at
  before update on public.land_referrals
  for each row
  execute function public.set_land_referrals_updated_at();

-- Notificar a gerencia cuando entra una captación nueva.
create or replace function public.notify_admins_new_captacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, message, link, metadata)
  select ur.user_id, 'captacion', 'Nueva captación de terreno',
         'Un corredor asociado ofreció "' || new.title || '" para revisión de gerencia.',
         '/admin/captaciones',
         jsonb_build_object('land_referral_id', new.id)
  from public.user_roles ur
  where ur.role = 'admin';
  return new;
end;
$$;

drop trigger if exists trg_notify_new_captacion on public.land_referrals;
create trigger trg_notify_new_captacion
  after insert on public.land_referrals
  for each row
  execute function public.notify_admins_new_captacion();

-- Notificar al corredor cuando gerencia cambia el estado.
create or replace function public.notify_referrer_captacion_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _label text;
begin
  if new.status is distinct from old.status then
    _label := case new.status
      when 'en_revision' then 'está en revisión'
      when 'en_negociacion' then 'está en negociación con el dueño'
      when 'acuerdo_firmado' then 'tiene acuerdo firmado'
      when 'publicada' then 'fue publicada en el marketplace'
      when 'rechazada' then 'fue rechazada'
      else 'cambió de estado'
    end;
    insert into public.notifications (user_id, type, title, message, link, metadata)
    values (new.referrer_id, 'captacion', 'Tu captación ' || _label,
            '"' || new.title || '" — estado: ' || new.status || '.',
            '/asesor/captaciones',
            jsonb_build_object('land_referral_id', new.id, 'status', new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_captacion_status on public.land_referrals;
create trigger trg_notify_captacion_status
  after update on public.land_referrals
  for each row
  execute function public.notify_referrer_captacion_status();
