-- Visual Scenarios Storage bucket and policies
-- Sprint 5.2: image upload support for base, overlay and thumbnails.

insert into storage.buckets (id, name, public)
values ('visual-scenarios', 'visual-scenarios', true)
on conflict (id) do update set
  public = excluded.public;

-- Public read access for visual scenario assets.
create policy "Public can read visual scenario assets"
  on storage.objects
  for select
  using (bucket_id = 'visual-scenarios');

-- Authenticated users can upload visual scenario assets.
-- Application-level controls still live in admin/agent UI and visual_scenarios RLS.
create policy "Authenticated users can upload visual scenario assets"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'visual-scenarios');

-- Authenticated users can update visual scenario assets.
create policy "Authenticated users can update visual scenario assets"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'visual-scenarios')
  with check (bucket_id = 'visual-scenarios');

-- Authenticated users can delete visual scenario assets.
create policy "Authenticated users can delete visual scenario assets"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'visual-scenarios');
