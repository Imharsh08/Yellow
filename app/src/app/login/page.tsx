import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";

  return (
    <main className="flex min-h-dvh flex-col justify-between bg-background px-margin-mobile pb-stack-lg pt-stack-lg">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-stack-md flex size-20 items-center justify-center rounded-full bg-primary-container/20">
          <span
            className="material-symbols-outlined icon-filled text-[40px] text-primary-container"
            aria-hidden="true"
          >
            footprint
          </span>
        </div>

        <h1 className="text-headline-lg-mobile font-bold text-on-surface">
          Yellow
        </h1>
        <p className="mt-stack-sm max-w-sm text-body-lg text-on-surface-variant">
          Your companion for the Kanwar Yatra. Track your walk, find bhojan
          shivirs and medical points, and help fellow kanwariyas along the way.
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <LoginForm next={next} />
        <p className="mt-stack-md text-center text-label-caps uppercase tracking-wide text-on-surface-variant">
          Har Har Mahadev 🙏
        </p>
      </div>
    </main>
  );
}
