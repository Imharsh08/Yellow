import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveRouteForUser } from "@/lib/route";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { RoadmapList } from "@/components/roadmap-list";

export default async function RoadmapPage() {
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

  // Resolved from the destination the user chose at onboarding, not a
  // hardcoded route.
  const active = await getActiveRouteForUser(user.id);

  return (
    <>
      <TopBar title="Your Roadmap" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-margin-mobile pb-[100px] pt-[72px]">
        <RoadmapList
          checkpoints={active?.checkpoints ?? []}
          totalKm={Number(active?.route.total_km ?? 0)}
          destName={active?.route.dest_name ?? profile.destination}
          originName={active?.route.origin_name ?? "the start"}
        />
      </main>
      <BottomNav />
    </>
  );
}
