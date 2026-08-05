"use client";

import { useState } from "react";

/**
 * Emergency access button.
 *
 * Present in the Stitch design system as a persistent floating action.
 * It is not a numbered BRD requirement, so it deliberately does nothing
 * clever: it dials India's real emergency numbers. No backend, nothing
 * to fail on a dead signal — a phone dialler works without data.
 */
export function SosButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Emergency help"
        className="fixed bottom-24 right-margin-mobile z-40 flex size-16 items-center justify-center rounded-full bg-[var(--color-sos)] shadow-[0_4px_24px_rgba(255,69,0,0.5)] transition-transform active:scale-90"
      >
        <span
          className="absolute inset-0 animate-sos-ping rounded-full border-2 border-[var(--color-sos)] opacity-50"
          aria-hidden="true"
        />
        <span
          className="material-symbols-outlined icon-filled text-[32px] text-white"
          aria-hidden="true"
        >
          emergency
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-black/50 p-margin-mobile pb-stack-lg"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Emergency contacts"
        >
          <div
            className="w-full rounded-xl bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-title-md font-semibold text-on-surface">
              Emergency help
            </h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Tap to call. Works even without mobile data.
            </p>

            <div className="mt-stack-md flex flex-col gap-stack-sm">
              <EmergencyLink
                number="112"
                label="Emergency (all services)"
                icon="e911_emergency"
              />
              <EmergencyLink
                number="108"
                label="Ambulance"
                icon="ambulance"
              />
              <EmergencyLink number="100" label="Police" icon="local_police" />
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-stack-md h-touch-target w-full rounded-full border-2 border-on-surface/20 text-body-lg font-semibold text-on-surface"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function EmergencyLink({
  number,
  label,
  icon,
}: {
  number: string;
  label: string;
  icon: string;
}) {
  return (
    <a
      href={`tel:${number}`}
      className="flex h-touch-target items-center gap-4 rounded-lg bg-error-container px-4 text-on-error-container active:scale-[0.98]"
    >
      <span className="material-symbols-outlined icon-filled" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1 text-left text-body-lg font-semibold">
        {label}
      </span>
      <span className="text-title-md font-bold tabular-nums">{number}</span>
    </a>
  );
}
