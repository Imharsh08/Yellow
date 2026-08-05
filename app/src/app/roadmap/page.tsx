import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { RoadmapList } from "@/components/roadmap-list";

export default async function RoadmapPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: route } = await supabase
    .from("routes")
    .select("*")
    .eq("slug", "haridwar-meerut")
    .single();

  const { data: checkpoints } = await supabase
    .from("checkpoints")
    .select("*")
    .eq("route_id", route?.id ?? "")
    .order("seq");

  return (
    <>
      <TopBar title="Your Roadmap" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-margin-mobile pb-[100px] pt-[72px]">
        <RoadmapList
          checkpoints={checkpoints ?? []}
          totalKm={Number(route?.total_km ?? 0)}
          destName={route?.dest_name ?? "your destination"}
        />
      </main>
      <BottomNav />
    </>
  );
}
