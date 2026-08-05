import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { ServicesList } from "@/components/services-list";
import { POI_META, POI_CATEGORIES, type PoiCategory, type PoiFeedItem } from "@/lib/types";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!POI_CATEGORIES.includes(category as PoiCategory)) notFound();
  const cat = category as PoiCategory;

  // Vlogs live in the feed, not in the services list.
  if (cat === "personal_vlog") redirect("/feed");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Distance sorting needs the user's position, which is only known in the
  // browser — so fetch the category here and let the client order it.
  const { data: pois } = await supabase
    .from("poi_feed")
    .select("*")
    .eq("category", cat)
    .order("created_at", { ascending: false })
    .limit(200);

  const meta = POI_META[cat];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-touch-target items-center gap-2 bg-surface px-margin-mobile shadow-sm">
        <Link
          href="/"
          aria-label="Back to home"
          className="flex size-10 items-center justify-center rounded-full text-on-surface active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
        </Link>
        <h1 className="flex-1 text-title-md font-semibold text-on-surface">
          {meta.label}
        </h1>
        <Link
          href={`/map?category=${cat}`}
          aria-label="View on map"
          className="flex size-10 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            map
          </span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-margin-mobile pb-[100px] pt-[72px]">
        <ServicesList
          category={cat}
          pois={(pois as PoiFeedItem[]) ?? []}
        />
      </main>

      <BottomNav />
    </>
  );
}
