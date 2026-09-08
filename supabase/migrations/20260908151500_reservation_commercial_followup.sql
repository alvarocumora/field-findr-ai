-- Commercial follow-up for reservations: persist checkout link and quote attribution.
alter table public.reservations
  add column if not exists payment_url text,
  add column if not exists source_quote_id uuid references public.sales_quotes(id) on delete set null,
  add column if not exists payment_link_shared_at timestamptz;

create index if not exists reservations_source_quote_idx
  on public.reservations(source_quote_id)
  where source_quote_id is not null;

comment on column public.reservations.payment_url is 'Persisted checkout URL so executives can resend payment without creating a new reservation.';
comment on column public.reservations.source_quote_id is 'Optional sales quote that originated the reservation.';
comment on column public.reservations.payment_link_shared_at is 'Last time an executive shared the payment link.';