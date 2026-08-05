-- ============================================================
-- Yellow — Kanwar Yatra Companion
-- Initial schema. Maps to BRD v1.0 functional requirements.
-- ============================================================

-- ---------- enums ----------

-- POI categories, verbatim from FR-4.
create type public.poi_category as enum (
  'bhojan_shivir',
  'medical_point',
  'rush_area',
  'personal_vlog',
  'charging_point',
  'other'
);

-- FR-6: lightweight moderation. POIs are visible by default and
-- hidden on review, matching "manual/lightweight in v1.0" (§9).
create type public.poi_status as enum ('visible', 'hidden', 'under_review');

-- ---------- profiles (FR-3) ----------

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null,
  phone         text,
  destination   text not null default 'Meerut',
  photo_url     text,
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Indian mobile numbers; permissive to allow +91 / 0 prefixes and spacing.
  constraint profiles_phone_check
    check (phone is null or phone ~ '^[0-9+][0-9 \-]{7,17}$')
);

comment on table public.profiles is
  'FR-3: name, contact number, destination captured at onboarding.';

-- ---------- routes & checkpoints (FR-8) ----------
-- Per BRD §9 this data is loaded by the product team, NOT user-generated.

create table public.routes (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  origin_name  text not null,
  origin_lat   double precision not null,
  origin_lng   double precision not null,
  dest_name    text not null,
  dest_lat     double precision not null,
  dest_lng     double precision not null,
  total_km     numeric(6, 2) not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.checkpoints (
  id            uuid primary key default gen_random_uuid(),
  route_id      uuid not null references public.routes (id) on delete cascade,
  seq           integer not null,
  name          text not null,
  lat           double precision not null,
  lng           double precision not null,
  -- Distance from route origin, measured along the route.
  km_from_start numeric(6, 2) not null,
  notes         text,
  created_at    timestamptz not null default now(),

  unique (route_id, seq)
);

create index checkpoints_route_seq_idx
  on public.checkpoints (route_id, seq);

comment on table public.checkpoints is
  'FR-8: route milestones every 5-10km. Seeded by product team, not users.';

-- ---------- POIs (FR-4, FR-5) ----------

create table public.pois (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  category     public.poi_category not null,
  title        text not null,
  note         text,
  lat          double precision not null,
  lng          double precision not null,
  photo_url    text,
  status       public.poi_status not null default 'visible',
  report_count integer not null default 0,
  created_at   timestamptz not null default now(),

  constraint pois_lat_check check (lat between -90 and 90),
  constraint pois_lng_check check (lng between -180 and 180),
  constraint pois_title_len check (char_length(title) between 1 and 120),
  constraint pois_note_len  check (note is null or char_length(note) <= 500)
);

-- Map viewport queries filter by status then bounding box.
create index pois_status_created_idx
  on public.pois (status, created_at desc);
create index pois_geo_idx
  on public.pois (lat, lng);
create index pois_user_idx
  on public.pois (user_id);

comment on table public.pois is
  'FR-4/FR-5: crowdsourced points of interest shown on the public map.';

-- ---------- reports (FR-6) ----------

create table public.poi_reports (
  id         uuid primary key default gen_random_uuid(),
  poi_id     uuid not null references public.pois (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  reason     text not null,
  created_at timestamptz not null default now(),

  -- One report per user per POI; prevents brigading a single point.
  unique (poi_id, user_id),
  constraint poi_reports_reason_len check (char_length(reason) between 1 and 300)
);

-- ---------- journey progress (FR-7, FR-8, FR-11) ----------

create table public.user_progress (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  route_id              uuid not null references public.routes (id) on delete cascade,
  started_at            timestamptz not null default now(),
  last_lat              double precision,
  last_lng              double precision,
  last_seen_at          timestamptz,
  km_covered            numeric(6, 2) not null default 0,
  last_checkpoint_seq   integer not null default 0,
  completed_at          timestamptz,
  certificate_issued_at timestamptz,

  -- One active journey per user per route.
  unique (user_id, route_id)
);

comment on table public.user_progress is
  'FR-7/FR-8: live distance + milestone state. FR-11: certificate issuance.';

-- ============================================================
-- Row Level Security
-- Every table is RLS-enabled. Public read where the BRD calls the
-- data public; writes always scoped to the owning user.
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.routes        enable row level security;
alter table public.checkpoints   enable row level security;
alter table public.pois          enable row level security;
alter table public.poi_reports   enable row level security;
alter table public.user_progress enable row level security;

-- profiles: a user reads and writes only their own row.
-- (POI attribution uses a denormalised display name via the view below,
--  so profiles need not be world-readable — phone numbers live here.)
create policy "profiles: self read"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "profiles: self insert"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

create policy "profiles: self update"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- routes / checkpoints: readable by any signed-in user, writable only
-- via service role (product team seeding) — no client write policy.
create policy "routes: authenticated read"
  on public.routes for select
  to authenticated
  using (is_active);

create policy "checkpoints: authenticated read"
  on public.checkpoints for select
  to authenticated
  using (
    exists (
      select 1 from public.routes r
      where r.id = checkpoints.route_id and r.is_active
    )
  );

-- pois: FR-5 says approved POIs are visible to all users.
create policy "pois: public read visible"
  on public.pois for select
  to authenticated
  using (status = 'visible' or user_id = (select auth.uid()));

create policy "pois: owner insert"
  on public.pois for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "pois: owner update"
  on public.pois for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "pois: owner delete"
  on public.pois for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- poi_reports: users file reports and see only their own.
create policy "poi_reports: self read"
  on public.poi_reports for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "poi_reports: self insert"
  on public.poi_reports for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- user_progress: strictly private to the walking user.
create policy "user_progress: self read"
  on public.user_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_progress: self insert"
  on public.user_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_progress: self update"
  on public.user_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- Public map feed
-- FR-5 requires "submitted-by" on the pin detail, but profiles are
-- private (they hold phone numbers). This view exposes only the
-- contributor's display name alongside visible POIs.
-- security_invoker keeps the caller's RLS on pois in force.
-- ============================================================

create view public.poi_feed
with (security_invoker = true) as
select
  p.id,
  p.category,
  p.title,
  p.note,
  p.lat,
  p.lng,
  p.photo_url,
  p.created_at,
  p.user_id,
  coalesce(pr.full_name, 'Kanwariya') as submitted_by
from public.pois p
left join public.profiles pr on pr.id = p.user_id
where p.status = 'visible';

-- ============================================================
-- Triggers & functions
-- ============================================================

-- Keep profiles.updated_at honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- FR-6: auto-hide a POI once it crosses a report threshold, so bad
-- content disappears without waiting for a human. Threshold is
-- deliberately low for v1.0 given manual review capacity (§9).
create or replace function public.bump_poi_report_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pois
     set report_count = report_count + 1,
         status = case
                    when report_count + 1 >= 3 then 'under_review'::public.poi_status
                    else status
                  end
   where id = new.poi_id;
  return new;
end;
$$;

create trigger poi_reports_bump_count
  after insert on public.poi_reports
  for each row execute function public.bump_poi_report_count();
