"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  const destination = String(formData.get("destination") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "Please enter your name." };
  }
  // Matches the profiles_phone_check constraint; validated here too so the
  // user gets a readable message instead of a Postgres error.
  if (phone && !/^[0-9+][0-9 \-]{7,17}$/.test(phone)) {
    return { error: "Please enter a valid contact number." };
  }
  if (!destination) {
    return { error: "Please choose your destination." };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    phone: phone || null,
    destination,
    photo_url: user.user_metadata?.avatar_url ?? null,
    onboarded_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  // Start the journey record so the tracker has state from the first screen.
  const { data: route } = await supabase
    .from("routes")
    .select("id")
    .eq("slug", "haridwar-meerut")
    .single();

  if (route) {
    await supabase
      .from("user_progress")
      .upsert(
        { user_id: user.id, route_id: route.id },
        { onConflict: "user_id,route_id", ignoreDuplicates: true },
      );
  }

  revalidatePath("/", "layout");
  redirect("/");
}
