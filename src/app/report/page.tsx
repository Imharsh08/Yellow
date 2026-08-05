import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "./report-form";

export default async function ReportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-margin-mobile pb-stack-lg pt-stack-md">
      <header className="mb-stack-md flex items-center gap-2">
        <Link
          href="/map"
          aria-label="Back to map"
          className="flex size-10 items-center justify-center rounded-full text-on-surface active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
        </Link>
        <h1 className="text-title-md font-semibold text-on-surface">
          Add a point
        </h1>
      </header>

      <p className="mb-stack-md text-body-lg text-on-surface-variant">
        Share something useful with fellow kanwariyas — a bhojan shivir, a
        medical camp, a charging point or a crowded stretch.
      </p>

      <ReportForm userId={user.id} />
    </main>
  );
}
