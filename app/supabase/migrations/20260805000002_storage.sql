-- ============================================================
-- Storage for POI photos (FR-4)
-- Public bucket: the map is public, so the photos on it are too.
-- 5MB cap and an image-only MIME allowlist keep uploads within the
-- "under 10 seconds on 3G/4G" non-functional requirement (§7).
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'poi-photos',
  'poi-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Anyone may view POI photos — they render on the public map.
create policy "poi photos: public read"
  on storage.objects for select
  using (bucket_id = 'poi-photos');

-- Uploads are foldered by user id: poi-photos/<uid>/<file>. A user may
-- only write inside their own folder.
create policy "poi photos: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'poi-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "poi photos: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'poi-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
