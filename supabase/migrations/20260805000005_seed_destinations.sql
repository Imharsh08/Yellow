-- ============================================================
-- Seed: popular Kanwar Yatra destinations
--
-- ⚠️  COORDINATE ACCURACY — READ BEFORE LAUNCH
--
-- Baba Augharnath (Meerut) is the temple's own OpenStreetMap position.
-- The other six are the coordinates of their LOCALITY (Baghpat town,
-- Ghaziabad city, Chandni Chowk, Nigambodh Ghat, Mahipalpur, Preet
-- Vihar), not the temple building itself — OSM has no reliable node for
-- those temples under these names.
--
-- Searching OSM by temple name is actively unsafe here: "Gauri Shankar
-- Temple Delhi" returns a temple in Vivek Vihar, ~8km from the Chandni
-- Chowk one intended. Locality coordinates are wrong by a few hundred
-- metres; a same-name mismatch would be wrong by kilometres.
--
-- Consequence: distance-to-destination is accurate to roughly the size
-- of the locality. Replace each lat/lng with the temple's exact gate
-- position before relying on this for final-approach navigation.
-- ============================================================

insert into public.destinations (slug, name, area, description, lat, lng, is_popular)
values
  (
    'augharnath-meerut',
    'Shri Baba Augharnath Shiv Mandir',
    'Meerut Cantt, UP',
    'A deeply historic and revered temple in Meerut that sees immense crowds as the yatra commences and passes through the city.',
    28.9967882, 77.6911342, true
  ),
  (
    'pura-mahadev-baghpat',
    'Pura Mahadev Mandir',
    'Baghpat, UP',
    'Ancient temple near Meerut receiving millions of kanwariyas from western UP, Delhi and Haryana for the synchronised jalabhishek on Shivratri.',
    29.0374779, 77.3062737, true
  ),
  (
    'dudheshwar-nath-ghaziabad',
    'Shri Dudheshwar Nath Mahadev Mandir',
    'Ghaziabad, UP',
    'Believed to be thousands of years old with a swayambhu (self-manifested) Shivling. One of the busiest NCR transit and worship hubs during Sawan.',
    28.7749966, 77.4586967, true
  ),
  (
    'gauri-shankar-chandni-chowk',
    'Shri Gauri Shankar Mandir',
    'Chandni Chowk, Delhi',
    'An 800-year-old landmark in Old Delhi where thousands of city devotees and incoming pilgrims offer sacred Ganga water.',
    28.6559834, 77.2321937, true
  ),
  (
    'neeli-chhatri-nigambodh',
    'Neeli Chhatri Mahadev Mandir',
    'Nigambodh Ghat, Delhi',
    'A historic Yamuna-adjacent shrine traditionally linked to the Pandavas, where city-based jalabhishek rituals take place.',
    28.6648184, 77.2365759, true
  ),
  (
    'gufawala-preet-vihar',
    'Shiv Mandir Gufawala',
    'Preet Vihar, Delhi',
    'Famous for its winding cave architecture and replicas of the 12 Jyotirlingas, drawing heavy footfall throughout Sawan.',
    28.6414176, 77.2952819, true
  ),
  (
    'birla-kanan-mahipalpur',
    'Mangal Mahadev Birla Kanan',
    'Mahipalpur, Delhi',
    'Noted for its towering 100-foot Shiva statue near the highway, serving major transit routes in southwest NCR.',
    28.5445370, 77.1279229, true
  )
on conflict (slug) do nothing;

-- Link the existing Haridwar→Meerut route to its destination so the
-- curated, hand-checked checkpoint chain keeps being used for Meerut
-- rather than being regenerated.
update public.routes r
   set destination_id = d.id
  from public.destinations d
 where d.slug = 'augharnath-meerut'
   and r.slug = 'haridwar-meerut'
   and r.destination_id is null;
