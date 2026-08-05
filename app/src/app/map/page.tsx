import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveRouteForUser } from "@/lib/route";
import { BottomNav } from "@/components/bottom-nav";
import { MapView } from "@/components/map-view";
import type { PoiCategory, PoiFeedItem } from "@/lib/types";
import { POI_CATEGORIES } from "@/lib/types";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const raw = typeof params.category === "string" ? params.category : null;
  const initialCategory =
    raw && POI_CATEGORIES.includes(raw as PoiCategory)
      ? (raw as PoiCategory)
      : null;

  // Set when arriving from the services list: focus and open this pin.
  const focusPoiId = typeof params.poi === "string" ? params.poi : null;

  // Newest first, capped — the map only renders what's in view anyway, and
  // an unbounded fetch would be punishing on a 3G connection.
  // Vlogs are excluded: they're stories, not places, and live in /feed.
  const { data: pois } = await supabase
    .from("poi_feed")
    .select("*")
    .neq("category", "personal_vlog")
    .order("created_at", { ascending: false })
    .limit(500);

  // Only needed for the fallback centre before GPS resolves; keyed to the
  // user's own route so they don't open the map on a different corridor.
  const active = await getActiveRouteForUser(user.id);
  const route = active?.route ?? null;

  return (
    <>
      <MapView
        pois={(pois as PoiFeedItem[]) ?? []}
        initialCategory={initialCategory}
        focusPoiId={focusPoiId}
        currentUserId={user.id}
        fallbackCenter={
          route
            ? { lat: route.origin_lat, lng: route.origin_lng }
            : { lat: 29.9384, lng: 78.1453 }
        }
      />
      <BottomNav />
    </>
  );
}
