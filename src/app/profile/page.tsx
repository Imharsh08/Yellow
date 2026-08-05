import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { formatKm } from "@/lib/geo";

export default async function ProfilePage() {
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

  if (!profile?.onboarded_at) redirect("/onboarding");

  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { count: poiCount } = await supabase
    .from("pois")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const kmCovered = Number(progress?.km_covered ?? 0);

  return (
    <>
      <TopBar title="Profile" />
      <main className="mx-auto w-full max-w-lg flex-1 px-margin-mobile pb-[100px] pt-[72px]">
        <section className="flex flex-col items-center py-stack-md text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary-container/20 text-[32px] font-bold text-primary">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-stack-sm text-title-md font-semibold text-on-surface">
            {profile.full_name}
          </h2>
          <Link
            href="/profile/destination"
            className="mt-1 flex items-center gap-1 rounded-full px-3 py-1 text-body-md text-on-surface-variant active:scale-95"
          >
            Walking to{" "}
            <span className="font-semibold text-on-surface">
              {profile.destination}
            </span>
            <span
              className="material-symbols-outlined text-[16px] text-primary"
              aria-hidden="true"
            >
              edit
            </span>
          </Link>
        </section>

        <section className="grid grid-cols-2 gap-gutter">
          <Stat label="Distance walked" value={formatKm(kmCovered)} />
          <Stat label="Points shared" value={String(poiCount ?? 0)} />
        </section>

        {/* FR-11: certificate on completion */}
        <section className="mt-stack-md">
          {progress?.completed_at ? (
            <Link
              href="/certificate"
              className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface p-4 active:scale-[0.99]"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-tertiary-fixed">
                <span
                  className="material-symbols-outlined icon-filled text-on-tertiary-fixed-variant"
                  aria-hidden="true"
                >
                  workspace_premium
                </span>
              </div>
              <div className="flex-1">
                <p className="text-title-md font-semibold text-on-surface">
                  Your certificate
                </p>
                <p className="text-body-md text-on-surface-variant">
                  Yatra complete — view and share
                </p>
              </div>
              <span
                className="material-symbols-outlined text-outline"
                aria-hidden="true"
              >
                chevron_right
              </span>
            </Link>
          ) : (
            <div className="rounded-xl border border-dashed border-outline-variant/60 p-4 text-center">
              <span
                className="material-symbols-outlined text-[28px] text-outline"
                aria-hidden="true"
              >
                workspace_premium
              </span>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Your completion certificate unlocks when you reach{" "}
                {profile.destination}.
              </p>
            </div>
          )}
        </section>

        <section className="mt-stack-md flex flex-col divide-y divide-outline-variant/30 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface">
          <Row
            href="/profile/destination"
            icon="temple_hindu"
            label="Change destination"
          />
          <Row href="/diet" icon="nutrition" label="Yatra diet plan" />
          <Row href="/map" icon="map" label="Public map" />
        </section>

        <dl className="mt-stack-md rounded-xl border border-outline-variant/30 bg-surface p-4 text-body-md">
          <div className="flex justify-between py-1">
            <dt className="text-on-surface-variant">Email</dt>
            <dd className="truncate pl-4 text-on-surface">{user.email}</dd>
          </div>
          {profile.phone && (
            <div className="flex justify-between py-1">
              <dt className="text-on-surface-variant">Phone</dt>
              <dd className="text-on-surface">{profile.phone}</dd>
            </div>
          )}
        </dl>

        <div className="mt-stack-md">
          <SignOutButton />
        </div>
      </main>
      <BottomNav />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface p-4">
      <p className="text-label-caps uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-title-md font-bold text-on-surface">{value}</p>
    </div>
  );
}

function Row({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-touch-target items-center gap-3 px-4 py-3 active:bg-surface-container-low"
    >
      <span className="material-symbols-outlined text-primary" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1 text-body-lg text-on-surface">{label}</span>
      <span className="material-symbols-outlined text-outline" aria-hidden="true">
        chevron_right
      </span>
    </Link>
  );
}
