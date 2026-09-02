create or replace function public.get_my_buyer_progress()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select lower(coalesce((select email from auth.users where id = auth.uid()), '')) as email,
           auth.uid() as uid
  )
  select jsonb_build_object(
    'leads', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id,
        'project_id', l.project_id,
        'project_name', p.name,
        'status', l.status,
        'interest_type', l.interest_type,
        'created_at', l.created_at,
        'last_contacted_at', l.last_contacted_at,
        'next_follow_up', l.next_follow_up
      ) order by l.created_at desc)
      from leads l
      left join projects p on p.id = l.project_id, me
      where me.email <> '' and lower(l.email) = me.email
    ), '[]'::jsonb),
    'visits', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id,
        'project_id', v.project_id,
        'project_name', p.name,
        'lot_id', v.lot_id,
        'lot_number', lo.lot_number,
        'scheduled_at', v.scheduled_at,
        'duration_minutes', v.duration_minutes,
        'mode', v.mode,
        'status', v.status,
        'outcome', v.outcome
      ) order by v.scheduled_at desc)
      from visits v
      left join projects p on p.id = v.project_id
      left join lots lo on lo.id = v.lot_id, me
      where me.email <> '' and lower(v.visitor_email) = me.email
    ), '[]'::jsonb),
    'reservations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'lot_id', r.lot_id,
        'lot_number', lo.lot_number,
        'project_id', lo.project_id,
        'project_name', p.name,
        'status', r.status,
        'reservation_amount', r.reservation_amount,
        'currency', r.currency,
        'paid_at', r.paid_at,
        'expires_at', r.expires_at,
        'created_at', r.created_at
      ) order by r.created_at desc)
      from reservations r
      join lots lo on lo.id = r.lot_id
      left join projects p on p.id = lo.project_id, me
      where r.user_id = me.uid
         or (me.email <> '' and lower(r.buyer_email) = me.email)
    ), '[]'::jsonb),
    'closings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'project_id', c.project_id,
        'project_name', p.name,
        'lot_id', c.lot_id,
        'lot_number', lo.lot_number,
        'sale_amount', c.sale_amount,
        'currency', c.currency,
        'status', c.status,
        'contract_signed_at', c.contract_signed_at,
        'closed_at', c.closed_at,
        'created_at', c.created_at
      ) order by c.created_at desc)
      from sales_closings c
      left join projects p on p.id = c.project_id
      left join lots lo on lo.id = c.lot_id, me
      where me.email <> '' and lower(c.buyer_email) = me.email
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_my_buyer_progress() from public, anon;
grant execute on function public.get_my_buyer_progress() to authenticated;