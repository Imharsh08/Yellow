import { createClient } from "@/lib/supabase/server";
import { ensureRouteForDestination, type ActiveRoute } from "@/lib/ensure-route";

export type { ActiveRoute };

/**
 * Resolves the route a user is walking, from their profile.
 *
 * `destination_id` is authoritative. Profiles written before destinations
 * existed only have the free-text `destination`, so those fall back to a
 * name match — that keeps early sign-ups working instead of showing them
 * an empty tracker.
 */
export async function getActiveRouteForUser(
  userId: string,
): Promise<ActiveRoute | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("destination, destination_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  if (profile.destination_id) {
    return ensureRouteForDestination(userId, profile.destination_id);
  }

  // Legacy profile: match the stored label against saved destinations.
  if (profile.destination) {
    const { data: match } = await supabase
      .from("destinations")
      .select("id")
      .ilike("name", `%${profile.destination}%`)
      .limit(1)
      .maybeSingle();

    if (match) return ensureRouteForDestination(userId, match.id);
  }

  return null;
}
