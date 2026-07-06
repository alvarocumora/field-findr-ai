DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'calculate_lead_score()',
    'create_closing_steps_on_paid()',
    'enqueue_listing_approval()',
    'handle_new_user()',
    'handle_reservation_status_change()',
    'notify_doc_deadline_approaching()',
    'notify_on_new_lead()',
    'notify_on_new_reservation()',
    'notify_on_reservation_paid()',
    'notify_on_visit_request()',
    'record_price_on_insert()',
    'record_price_on_update()',
    'sync_listing_status_from_approval()',
    'update_next_payment_date()',
    'update_project_lot_counts()',
    'update_updated_at_column()',
    'mark_overdue_payments()',
    'expire_stale_reservations()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
CREATE POLICY "Owners can list their property images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'property-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "Anyone can view lot images" ON storage.objects;
CREATE POLICY "Owners can list their lot images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lot-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "Anyone can view tour panoramas" ON storage.objects;
CREATE POLICY "Owners can list their tour panoramas"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tour-panoramas'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "Anyone can view 3d assets" ON storage.objects;
CREATE POLICY "Owners can list their 3d assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = '3d-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Owners can list their avatars"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );