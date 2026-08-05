import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { FeedList } from "@/components/feed-list";
import type { PoiFeedItem } from "@/lib/types";

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Vlogs only — the community stories layer, shown chronologically
  // rather than spatially.
  const { data: vlogs } = await supabase
    .from("poi_feed")
    .select("*")
    .eq("category", "personal_vlog")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <TopBar title="Feed" />
      <main className="mx-auto w-full max-w-lg flex-1 px-margin-mobile pb-[100px] pt-[72px]">
        <FeedList vlogs={(vlogs as PoiFeedItem[]) ?? []} />
      </main>
      <BottomNav />
    </>
  );
}
