"use client";

import { useEffect, useState } from "react";

/**
 * Relative timestamp ("5 min ago") that is safe to server-render.
 *
 * A relative time computed from `Date.now()` differs between the server
 * render and client hydration whenever the two straddle a minute
 * boundary, which React reports as a hydration mismatch. So the first
 * render — server and client alike — emits a fixed absolute date, and the
 * relative form is swapped in after mount.
 */
export function TimeAgo({ iso }: { iso: string }) {
  const [relative, setRelative] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRelative(formatRelative(iso));
  }, [iso]);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {relative ?? formatAbsolute(iso)}
    </time>
  );
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatRelative(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return formatAbsolute(iso);
}
