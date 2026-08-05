import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CertificateCard } from "@/components/certificate-card";

export default async function CertificatePage() {
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

  // FR-11 issues the certificate on completion — don't hand one out early.
  if (!progress?.completed_at) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-stack-md px-margin-mobile text-center">
        <span
          className="material-symbols-outlined text-[40px] text-outline"
          aria-hidden="true"
        >
          workspace_premium
        </span>
        <h1 className="text-title-md font-semibold text-on-surface">
          Not just yet
        </h1>
        <p className="max-w-sm text-body-lg text-on-surface-variant">
          Your certificate unlocks when you reach {profile.destination}. Keep
          walking — you&apos;re on your way.
        </p>
        <Link
          href="/"
          className="flex h-touch-target items-center rounded-full bg-primary-container px-8 font-semibold text-on-primary-container"
        >
          Back to my yatra
        </Link>
      </main>
    );
  }

  // Record issuance the first time it's viewed (FR-11 traceability).
  if (!progress.certificate_issued_at) {
    await supabase
      .from("user_progress")
      .update({ certificate_issued_at: new Date().toISOString() })
      .eq("id", progress.id);
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-margin-mobile py-stack-md">
      <CertificateCard
        name={profile.full_name}
        destination={profile.destination}
        km={Number(progress.km_covered)}
        completedAt={progress.completed_at}
      />
    </main>
  );
}
