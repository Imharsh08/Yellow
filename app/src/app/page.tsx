import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveRouteForUser } from "@/lib/route";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { SosButton } from "@/components/sos-button";
import { Dashboard } from "@/components/dashboard";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // FR-3 details are required before the tracker means anything.
  if (!profile?.onboarded_at) redirect("/onboarding");

  // Resolved from the destination chosen at onboarding, not a fixed slug.
  // Generates the route on first visit if it doesn't exist yet.
  const active = await getActiveRouteForUser(user.id);

  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("route_id", active?.route.id ?? "")
    .maybeSingle();

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-margin-mobile pb-[120px] pt-[72px]">
        <Dashboard
          firstName={profile.full_name.split(" ")[0]}
          route={active?.route ?? null}
          checkpoints={active?.checkpoints ?? []}
          initialProgress={progress ?? null}
        />
      </main>
      <SosButton />
      <BottomNav />
    </>
  );
}
