import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { searchDestinations } from "@/app/onboarding/search-destinations";
import { getActiveRouteForUser } from "@/lib/route";
import { ChangeDestinationForm } from "./change-destination-form";

export default async function ChangeDestinationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("destination, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded_at) redirect("/onboarding");

  const active = await getActiveRouteForUser(user.id);
  const popular = await searchDestinations("");

  const { data: progress } = await supabase
    .from("user_progress")
    .select("km_covered")
    .eq("user_id", user.id)
    .eq("route_id", active?.route.id ?? "")
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-margin-mobile pb-stack-lg pt-stack-md">
      <header className="mb-stack-md flex items-center gap-2">
        <Link
          href="/profile"
          aria-label="Back to profile"
          className="flex size-10 items-center justify-center rounded-full text-on-surface active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
        </Link>
        <h1 className="text-title-md font-semibold text-on-surface">
          Change destination
        </h1>
      </header>

      <ChangeDestinationForm
        popular={popular}
        currentName={profile.destination}
        currentTotalKm={Number(active?.route.total_km ?? 0)}
        kmCovered={Number(progress?.km_covered ?? 0)}
      />
    </main>
  );
}
