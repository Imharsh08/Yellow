-- ============================================================
-- Destinations: popular temples + user-defined custom targets
--
-- All the popular Kanwar Yatra destinations sit on the same corridor
-- south from Haridwar: Meerut ~114km, then Baghpat / Ghaziabad / Delhi
-- another 33-75km beyond. So rather than modelling each as an unrelated
-- route, a destination is a point on (or beyond) a shared spine, and a
-- route is generated per user from origin -> their destination.
-- ============================================================

create table public.destinations (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique,
  name         text not null,
  -- Short locality label, e.g. "Meerut Cantt, UP".
  area         text,
  description  text,
  lat          double precision not null,
  lng          double precision not null,
  -- Popular destinations are curated and shown first in the picker.
  is_popular   boolean not null default false,
  -- Custom destinations are created by users via geocoding; kept so the
  -- same typed place reuses one row instead of duplicating per user.
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),

  constraint destinations_lat_check check (lat between -90 and 90),
  constraint destinations_lng_check check (lng between -180 and 180)
);

create index destinations_popular_idx
  on public.destinations (is_popular, name);

comment on table public.destinations is
  'Yatra end points. Curated temples plus geocoded custom destinations.';

-- ---------- routes become per-destination ----------

alter table public.routes
  add column destination_id uuid references public.destinations (id) on delete cascade,
  -- Generated routes belong to one user; curated routes are shared (null).
  add column owner_id uuid references auth.users (id) on delete cascade,
  add column is_generated boolean not null default false;

-- A user gets at most one generated route per destination.
create unique index routes_owner_destination_idx
  on public.routes (owner_id, destination_id)
  where owner_id is not null;

create index routes_destination_idx
  on public.routes (destination_id);

-- The original seeded route predates destinations; slug stays unique so
-- it is safe to leave in place and link once its destination row exists.

-- ---------- RLS ----------

alter table public.destinations enable row level security;

-- Everyone signed in can read every destination: the picker shows the
-- curated list, and a custom one may be reused by another walker heading
-- to the same place.
create policy "destinations: authenticated read"
  on public.destinations for select
  to authenticated
  using (true);

-- Users may add a destination (custom, geocoded), but never mark it
-- popular — that stays a curation decision made with the service role.
create policy "destinations: authenticated insert"
  on public.destinations for insert
  to authenticated
  with check ((select auth.uid()) = created_by and is_popular = false);

-- Routes: the earlier policy exposed every active route. Replace it so a
-- user sees curated routes plus their own generated ones.
drop policy if exists "routes: authenticated read" on public.routes;

create policy "routes: read curated and own"
  on public.routes for select
  to authenticated
  using (
    is_active
    and (owner_id is null or owner_id = (select auth.uid()))
  );

create policy "routes: insert own generated"
  on public.routes for insert
  to authenticated
  with check ((select auth.uid()) = owner_id and is_generated);

create policy "routes: update own generated"
  on public.routes for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Checkpoints follow their route's visibility, and a user may write
-- checkpoints only for a route they own.
drop policy if exists "checkpoints: authenticated read" on public.checkpoints;

create policy "checkpoints: read for visible routes"
  on public.checkpoints for select
  to authenticated
  using (
    exists (
      select 1 from public.routes r
      where r.id = checkpoints.route_id
        and r.is_active
        and (r.owner_id is null or r.owner_id = (select auth.uid()))
    )
  );

create policy "checkpoints: insert for own routes"
  on public.checkpoints for insert
  to authenticated
  with check (
    exists (
      select 1 from public.routes r
      where r.id = checkpoints.route_id
        and r.owner_id = (select auth.uid())
    )
  );

create policy "checkpoints: delete for own routes"
  on public.checkpoints for delete
  to authenticated
  using (
    exists (
      select 1 from public.routes r
      where r.id = checkpoints.route_id
        and r.owner_id = (select auth.uid())
    )
  );

-- ---------- profiles point at a destination ----------

alter table public.profiles
  add column destination_id uuid references public.destinations (id) on delete set null;

comment on column public.profiles.destination is
  'Free-text label kept for display and certificates; destination_id is authoritative.';
