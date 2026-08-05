# Yellow — launch checklist

Everything is built. What's left needs your accounts, which I can't create
for you. Budget **30–40 minutes** end to end.

---

## 1. Create the Supabase project (~5 min)

1. Go to <https://supabase.com/dashboard> and sign in.
2. **New project** → name it `yellow`, pick region **Mumbai (ap-south-1)**
   (closest to the route — every millisecond counts on 3G).
3. Save the database password somewhere safe.
4. Wait for provisioning to finish (~2 min).

## 2. Apply the database schema (~5 min)

Open **SQL Editor** in the Supabase dashboard and run these three files
**in order**, pasting the contents of each:

| Order | File | What it creates |
|---|---|---|
| 1 | `supabase/migrations/20260805000001_init_schema.sql` | Tables, enums, RLS policies, moderation trigger |
| 2 | `supabase/migrations/20260805000002_storage.sql` | `poi-photos` bucket + storage policies |
| 3 | `supabase/migrations/20260805000003_seed_route.sql` | Haridwar→Meerut route + 22 checkpoints |
| 4 | `supabase/migrations/20260805000004_destinations.sql` | Destinations table, per-user generated routes, RLS |
| 5 | `supabase/migrations/20260805000005_seed_destinations.sql` | 7 popular temples (Meerut, Baghpat, Ghaziabad, Delhi) |

Verify: **Table Editor** should show `checkpoints` with 22 rows.

> ⚠️ **The seeded route is approximate.** The 7 named towns are real
> OpenStreetMap coordinates, but the points between them are straight-line
> interpolations, not surveyed positions on NH-58. Distances shown to users
> are indicative. Replace the intermediate rows with GPS points from your
> own yatra notes before you rely on this for navigation. See the header
> comment in the seed file.

## 3. Wire the app to Supabase (~2 min)

In the dashboard: **Project Settings → API**. Copy the two values into
`app/.env.local` (the file already exists with placeholders):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Both are safe to expose in the browser — RLS is what protects the data,
and every table has it enabled.

At this point `npm run dev` works with **email sign-in** already. Google
is step 5.

## 4. Deploy (~10 min)

### Vercel (current target)

```bash
npx vercel            # first run walks you through login + linking
npx vercel --prod
```

When prompted, add the same two environment variables. Note the URL it
gives you (e.g. `https://yellow-abc123.vercel.app`) — you need it next.

The app lives at the repo root (`package.json` is top-level), so Vercel's
default **Root Directory** of `/` is correct — leave it blank. Reference
material lives in `docs/` and is not part of the build.

### Cloudflare — not supported

**Deploy this app to Vercel, not Cloudflare.** Both Cloudflare options
were tried and neither works:

- **Pages** serves static files only. Every route here is server-rendered
  (auth, Supabase queries, server actions), so there is nothing for Pages
  to serve.
- **Workers** needs the OpenNext adapter, which explicitly does not
  support Node middleware. `src/proxy.ts` (auth gating + Supabase session
  refresh) runs on the Node runtime, and Next 16 mandates that and
  rejects `export const runtime` in a proxy file. The two requirements
  are mutually exclusive; the adapter build fails with
  `Node.js middleware is not currently supported`.

The adapter config was removed from the repo because its presence makes
Cloudflare auto-detect OpenNext and run `wrangler deploy` on every push,
which then fails.

**If you connected a Cloudflare project to this repo, delete it** —
otherwise it keeps building and failing alongside Vercel, and its failure
emails will drown out real problems.

To revisit later, check <https://opennext.js.org/cloudflare> for Node
middleware support, then reinstall `@opennextjs/cloudflare` and `wrangler`
and restore `wrangler.jsonc` / `open-next.config.ts` from git history
(commit `289a06e`).

The alternative — deleting `proxy.ts` and gating auth in each page — works
on Cloudflare but loses edge session refresh and makes it possible to
ship an unprotected page by forgetting a check.

## 5. Google Sign-In (FR-1) (~15 min)

This is the only genuinely fiddly step.

**In Google Cloud Console** (<https://console.cloud.google.com>):

1. Create a project → **APIs & Services → OAuth consent screen**
2. User type **External**, fill in app name `Yellow`, your support email,
   and a developer contact. Save.
3. **Credentials → Create Credentials → OAuth client ID**
4. Application type **Web application**
5. Under **Authorised redirect URIs**, add exactly:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   (Find `<your-project-ref>` in the Supabase URL from step 3.)
6. Copy the **Client ID** and **Client secret**.

**In Supabase** → **Authentication → Providers → Google**:

- Toggle it on, paste the Client ID and Client secret, save.

**In Supabase** → **Authentication → URL Configuration**:

- **Site URL**: your Vercel production URL
- **Redirect URLs**: add both
  ```
  https://your-app.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

> While the consent screen is in **Testing** mode only accounts you list
> as test users can sign in. For a public launch, hit **Publish app** on
> the consent screen. Unverified apps show a "Google hasn't verified this
> app" interstitial — users can proceed via *Advanced → Go to Yellow*.
> Full verification takes days to weeks, so plan for that warning on day
> one, or lean on email sign-in, which has no such friction.

## 6. Smoke test on a real phone

Open the production URL on an Android phone and check:

- [ ] Sign in (Google or email)
- [ ] Onboarding saves name, phone, destination
- [ ] Allow location → home screen shows a real distance, not 0
- [ ] Weather chip appears with a "feels like" reading
- [ ] Map loads, pins render, filters work
- [ ] Add a point with a photo → it appears on the map
- [ ] Roadmap shows reached milestones with ticks
- [ ] "Add to Home Screen" installs it as a PWA

---

## What's built vs. the BRD

| ID | Requirement | Status |
|---|---|---|
| FR-1 | Google Sign-In | ✅ Google + email magic link |
| FR-2 | Location collection | ✅ Foreground `watchPosition`, permission asked at onboarding |
| FR-3 | Profile details | ✅ |
| FR-4 | Public POI upload | ✅ 6 categories, photo, geotag, browser-side compression |
| FR-5 | Public map view | ✅ MapLibre + OSM, filters, detail sheet with distance/attribution/time |
| FR-6 | Content moderation | ✅ Report flow; auto-hides at 3 reports pending manual review |
| FR-7 | Animated distance tracker | ✅ Eased counter, interpolated between checkpoints |
| FR-8 | Checkpoint roadmap | ✅ 22 milestones ~7km apart, steps/km, completion ticks |
| FR-9 | Weather updates | ✅ Open-Meteo, framed as rest/departure advice |
| FR-10 | Diet plan | ✅ Static, sattvic-aware |
| FR-11 | Completion certificate | ✅ Auto-unlocks at destination, Web Share |
| FR-12 | Push notifications | ❌ Phase 3 in the BRD; not built |

**Deliberately not built** (and why):

- **Offline-first** — out of scope per BRD §3.2. What exists: cached last
  position, an offline banner, and last-known progress from the server so
  the screen is never blank. Queued POI uploads on reconnect are *not*
  implemented.
- **Background location** — the browser cannot track with the screen off.
  This is the single biggest reason to wrap this in a native shell for the
  Play Store. Distance updates while the app is open and foregrounded.
- **Push notifications** (FR-12) — needs VAPID keys and a service worker.

## Known limitations worth knowing before launch

1. **Route accuracy** — see the warning in step 2. This is the most
   important thing to fix.
2. **Progress can't be resumed across devices mid-walk** — progress is
   per-user per-route in the DB, so it does follow the account, but the
   tracker snaps to the nearest checkpoint rather than tracing the actual
   path walked.
3. **Moderation is manual** — a POI hides itself at 3 reports. There's no
   admin UI; review via the Supabase Table Editor (`pois` where
   `status = 'under_review'`).
4. **OSM tile usage policy** — the free tile server is fine for launch
   traffic but is not built for lakhs of concurrent users. If usage spikes,
   switch to a paid tile provider (MapTiler, Mapbox) by changing the
   `style` object in `src/components/map-view.tsx`.
