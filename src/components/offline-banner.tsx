"use client";

import { useSyncExternalStore } from "react";

/**
 * Connectivity notice (NFR §7: "graceful degradation on low/no signal").
 *
 * The BRD flags patchy connectivity on rural stretches as a live risk, so
 * the app states its status plainly rather than silently failing. Wording
 * is deliberately reassuring — a lost signal mid-walk should not read as
 * "the app is broken".
 */
function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function OfflineBanner() {
  // navigator.onLine is external browser state, so read it through
  // useSyncExternalStore rather than mirroring it into an effect.
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // assume online during SSR
  );

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[100] bg-on-surface-variant px-margin-mobile py-2 text-center text-label-caps font-bold uppercase tracking-wide text-surface"
    >
      <span className="material-symbols-outlined align-middle text-[16px]">
        cloud_off
      </span>{" "}
      No signal — showing your last saved journey
    </div>
  );
}
