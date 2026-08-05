-- ============================================================
-- Seed: Haridwar -> Meerut (NH-58 corridor)
--
-- ⚠️  APPROXIMATE DATA — REQUIRES PRODUCT-TEAM REVIEW BEFORE LAUNCH.
--
-- BRD §9 states route/checkpoint data is defined and loaded by the
-- product team. That data did not exist, so this seed was generated to
-- unblock FR-7/FR-8. How it was built:
--   • The 7 named towns are real coordinates from OpenStreetMap.
--   • Intermediate points are STRAIGHT-LINE INTERPOLATIONS between
--     towns, not surveyed positions on the actual road. They will sit
--     off the physical highway by up to a few hundred metres.
--   • km_from_start scales the straight-line chain (124.7km) to the
--     ~150km real NH-58 road distance. Per-segment error remains.
--
-- Consequence: distances shown to users are indicative, not exact.
-- Replace intermediate rows with GPS points from the founder's own
-- yatra notes before relying on this for navigation.
-- ============================================================

insert into public.routes (
  id, slug, name,
  origin_name, origin_lat, origin_lng,
  dest_name, dest_lat, dest_lng,
  total_km, is_active
)
values (
  '11111111-1111-4111-8111-111111111111',
  'haridwar-meerut',
  'Haridwar → Meerut',
  'Har Ki Pauri, Haridwar', 29.9384473, 78.1452985,
  'Meerut', 29.0018557, 77.7679671,
  150.00, true
)
on conflict (id) do nothing;

insert into public.checkpoints (route_id, seq, name, lat, lng, km_from_start, notes)
values
  ('11111111-1111-4111-8111-111111111111', 0, 'Har Ki Pauri, Haridwar', 29.9384473, 78.1452985, 0, 'Major stop'),
  ('11111111-1111-4111-8111-111111111111', 1, 'Towards Bahadrabad', 29.929087, 78.094483, 6.02, null),
  ('11111111-1111-4111-8111-111111111111', 2, 'Bahadrabad', 29.919726, 78.043667, 12.05, 'Major stop'),
  ('11111111-1111-4111-8111-111111111111', 3, 'Towards Roorkee (1/3)', 29.902934, 77.992516, 18.39, null),
  ('11111111-1111-4111-8111-111111111111', 4, 'Towards Roorkee (2/3)', 29.886142, 77.941364, 24.74, null),
  ('11111111-1111-4111-8111-111111111111', 5, 'Roorkee', 29.86935, 77.890212, 31.08, 'Major stop'),
  ('11111111-1111-4111-8111-111111111111', 6, 'Manglaur', 29.79215, 77.876064, 41.54, 'Major stop'),
  ('11111111-1111-4111-8111-111111111111', 7, 'Towards Muzaffarnagar (1/7)', 29.743228, 77.857046, 48.45, null),
  ('11111111-1111-4111-8111-111111111111', 8, 'Towards Muzaffarnagar (2/7)', 29.694306, 77.838027, 55.36, null),
  ('11111111-1111-4111-8111-111111111111', 9, 'Towards Muzaffarnagar (3/7)', 29.645385, 77.819008, 62.26, null),
  ('11111111-1111-4111-8111-111111111111', 10, 'Towards Muzaffarnagar (4/7)', 29.596463, 77.79999, 69.17, null),
  ('11111111-1111-4111-8111-111111111111', 11, 'Towards Muzaffarnagar (5/7)', 29.547541, 77.780971, 76.08, null),
  ('11111111-1111-4111-8111-111111111111', 12, 'Towards Muzaffarnagar (6/7)', 29.49862, 77.761952, 82.99, null),
  ('11111111-1111-4111-8111-111111111111', 13, 'Muzaffarnagar', 29.449698, 77.742933, 89.9, 'Major stop'),
  ('11111111-1111-4111-8111-111111111111', 14, 'Towards Khatauli (1/3)', 29.391085, 77.741109, 97.74, null),
  ('11111111-1111-4111-8111-111111111111', 15, 'Towards Khatauli (2/3)', 29.332473, 77.739285, 105.59, null),
  ('11111111-1111-4111-8111-111111111111', 16, 'Khatauli', 29.27386, 77.737461, 113.43, 'Major stop'),
  ('11111111-1111-4111-8111-111111111111', 17, 'Towards Meerut (1/5)', 29.219459, 77.743562, 120.75, null),
  ('11111111-1111-4111-8111-111111111111', 18, 'Towards Meerut (2/5)', 29.165058, 77.749663, 128.06, null),
  ('11111111-1111-4111-8111-111111111111', 19, 'Towards Meerut (3/5)', 29.110657, 77.755765, 135.37, null),
  ('11111111-1111-4111-8111-111111111111', 20, 'Towards Meerut (4/5)', 29.056257, 77.761866, 142.69, null),
  ('11111111-1111-4111-8111-111111111111', 21, 'Meerut', 29.001856, 77.767967, 150, 'Major stop')
on conflict (route_id, seq) do nothing;
