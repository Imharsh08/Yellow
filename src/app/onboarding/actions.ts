"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureRouteForDestination } from "@/lib/ensure-route";

export interface OnboardingState {
  error?: string;
}

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  // The picker submits either a saved destination's id, or the name and
  // coordinates of a freshly geocoded place that has no row yet.
  const destinationId = String(formData.get("destination_id") ?? "").trim();
  const destinationName = String(formData.get("destination_name") ?? "").trim();
  const destinationArea = String(formData.get("destination_area") ?? "").trim();
  const destLat = Number(formData.get("destination_lat"));
  const destLng = Number(formData.get("destination_lng"));

  if (fullName.length < 2) {
    return { error: "Please enter your name." };
  }
  // Matches the profiles_phone_check constraint; validated here too so the
  // user gets a readable message instead of a Postgres error.
  if (phone && !/^[0-9+][0-9 \-]{7,17}$/.test(phone)) {
    return { error: "Please enter a valid contact number." };
  }
  if (!destinationName) {
    return { error: "Please choose where you're walking to." };
  }

  let resolvedId = destinationId || null;

  // A custom destination gets saved once, then reused by anyone else who
  // picks the same place.
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

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    phone: phone || null,
    destination: destinationName,
    destination_id: resolvedId,
    photo_url: user.user_metadata?.avatar_url ?? null,
    onboarded_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  // Build the route now (curated if one exists, generated otherwise) so
  // the dashboard has milestones on the very first render.
  const active = await ensureRouteForDestination(user.id, resolvedId);

  if (active) {
    await supabase
      .from("user_progress")
      .upsert(
        { user_id: user.id, route_id: active.route.id },
        { onConflict: "user_id,route_id", ignoreDuplicates: true },
      );
  }

  revalidatePath("/", "layout");
  redirect("/");
}
