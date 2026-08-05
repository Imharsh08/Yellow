import { createClient } from "@/lib/supabase/server";
import { generateRoute } from "@/lib/generate-route";
import type { Checkpoint, Destination, Route } from "@/lib/types";

export interface ActiveRoute {
  route: Route;
  checkpoints: Checkpoint[];
  destination: Destination | null;
}

/**
 * Returns the route for a user's destination, generating it on first use.
 *
 * Curated routes (currently Haridwar→Meerut, whose checkpoints were
 * hand-checked) are shared and always preferred. Anything else gets a
 * generated route owned by that user, created once and reused after.
 */
export async function ensureRouteForDestination(
  userId: string,
  destinationId: string,
): Promise<ActiveRoute | null> {
  const supabase = await createClient();

  const { data: destination } = await supabase
    .from("destinations")
    .select("*")
    .eq("id", destinationId)
    .maybeSingle();

  if (!destination) return null;

  // A curated route for this destination beats anything generated.
  const { data: curated } = await supabase
    .from("routes")
    .select("*")
    .eq("destination_id", destinationId)
    .is("owner_id", null)
    .eq("is_active", true)
    .maybeSingle();

  if (curated) {
    return { route: curated, checkpoints: await loadCheckpoints(curated.id), destination };
  }

  // Already generated for this user?
  const { data: existing } = await supabase
    .from("routes")
    .select("*")
    .eq("destination_id", destinationId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (existing) {
    return { route: existing, checkpoints: await loadCheckpoints(existing.id), destination };
  }

  // Generate one.
  const generated = generateRoute({
    name: destination.name,
    lat: destination.lat,
    lng: destination.lng,
  });

  const { data: created, error: routeError } = await supabase
    .from("routes")
    .insert({
      slug: `gen-${userId.slice(0, 8)}-${destination.slug ?? destinationId.slice(0, 8)}`,
      name: `${generated.originName} → ${destination.name}`,
      origin_name: generated.originName,
      origin_lat: generated.originLat,
      origin_lng: generated.originLng,
      dest_name: destination.name,
      dest_lat: destination.lat,
      dest_lng: destination.lng,
      total_km: generated.totalKm,
      is_active: true,
      destination_id: destinationId,
      owner_id: userId,
      is_generated: true,
    })
    .select()
    .single();

  if (routeError || !created) return null;

  const { error: cpError } = await supabase.from("checkpoints").insert(
    generated.checkpoints.map((cp) => ({
      route_id: created.id,
      seq: cp.seq,
      name: cp.name,
      lat: cp.lat,
      lng: cp.lng,
      km_from_start: cp.km_from_start,
      notes: cp.notes,
    })),
  );

  if (cpError) {
    // A route with no milestones is worse than none — the tracker would
    // report zero distance. Roll it back so the next attempt retries.
    await supabase.from("routes").delete().eq("id", created.id);
    return null;
  }

  return {
    route: created,
    checkpoints: await loadCheckpoints(created.id),
    destination,
  };
}

async function loadCheckpoints(routeId: string): Promise<Checkpoint[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("checkpoints")
    .select("*")
    .eq("route_id", routeId)
    .order("seq");
  return data ?? [];
}
