import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";
import { searchDestinations } from "./search-destinations";

export default async function OnboardingPage() {
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

  if (profile?.onboarded_at) redirect("/");

  // Google gives us a name; pre-fill it so there is less to type.
  const suggestedName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";

  const popular = await searchDestinations("");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-margin-mobile pb-stack-lg pt-stack-lg">
      <header className="mb-stack-lg">
        <p className="text-label-caps font-bold uppercase tracking-wide text-primary">
          Step 1 of 1
        </p>
        <h1 className="mt-2 text-headline-lg-mobile font-bold text-on-surface">
          Tell us about your yatra
        </h1>
        <p className="mt-stack-sm text-body-lg text-on-surface-variant">
          We use this to personalise your tracker and your completion
          certificate.
        </p>
      </header>

      <OnboardingForm suggestedName={suggestedName} popular={popular} />
    </main>
  );
}
