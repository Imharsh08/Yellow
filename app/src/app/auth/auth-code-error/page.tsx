import Link from "next/link";

export default function AuthCodeError() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-stack-md bg-background px-margin-mobile text-center">
      <span
        className="material-symbols-outlined text-[40px] text-error"
        aria-hidden="true"
      >
        error
      </span>
      <h1 className="text-headline-lg-mobile font-bold text-on-surface">
        Sign-in didn&apos;t complete
      </h1>
      <p className="max-w-sm text-body-lg text-on-surface-variant">
        The link may have expired or already been used. Please try signing in
        again.
      </p>
      <Link
        href="/login"
        className="flex h-touch-target items-center justify-center rounded-full bg-primary-container px-8 text-body-lg font-semibold text-on-primary-container"
      >
        Back to sign in
      </Link>
    </main>
  );
}
