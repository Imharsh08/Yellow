"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureRouteForDestination } from "@/lib/ensure-route";

export interface ChangeDestinationState {
  error?: string;
}

/**
 * Changes the destination of an in-progress yatra (FR-3).
 *
 * Distance already walked is kept. `user_progress` is keyed per route, so
 * the old row survives untouched — switching back later restores it — and
 * the new route's progress is recalculated from live GPS by
 * `locateOnRoute`, since every popular destination shares the same
 * corridor south from Haridwar.
 */
export async function changeDestination(
  _prev: ChangeDestinationState,
  formData: FormData,
): Promise<ChangeDestinationState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const destinationId = String(formData.get("destination_id") ?? "").trim();
  const destinationName = String(formData.get("destination_name") ?? "").trim();
  const destinationArea = String(formData.get("destination_area") ?? "").trim();
  const destLat = Number(formData.get("destination_lat"));
  const destLng = Number(formData.get("destination_lng"));

  if (!destinationName) {
    return { error: "Please choose where you're walking to." };
  }

  let resolvedId = destinationId || null;

  // Custom destinations are saved once and reused by anyone heading to
  // the same place.
  if (!resolvedId) {
    if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) {
      return { error: "Please pick your destination from the list." };
    }

    const { data: created, error: destError } = await supabase
      .from("destinations")
      .insert({
        name: destinationName,
        area: destinationArea || null,
        lat: destLat,
        lng: destLng,
        is_popular: false,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (destError || !created) {
      return { error: "Couldn't save that destination. Please try again." };
    }
    resolvedId = created.id;
  }

  // Build the new route before touching the profile — if generation
  // fails, the user keeps a working tracker rather than being left
  // pointing at a destination with no milestones.
  const active = await ensureRouteForDestination(user.id, resolvedId);

  if (!active) {
    return {
      error: "Couldn't plan a route to that destination. Please try another.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      destination: destinationName,
      destination_id: resolvedId,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await supabase
    .from("user_progress")
    .upsert(
      { user_id: user.id, route_id: active.route.id },
      { onConflict: "user_id,route_id", ignoreDuplicates: true },
    );

  revalidatePath("/", "layout");
  redirect("/profile");
}
