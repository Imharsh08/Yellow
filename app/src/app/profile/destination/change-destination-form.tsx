"use client";

import { useActionState, useState } from "react";
import { changeDestination, type ChangeDestinationState } from "./actions";
import { DestinationPicker } from "@/components/destination-picker";
import type { DestinationOption } from "@/app/onboarding/search-destinations";
import { formatKm, formatWalkingTime } from "@/lib/geo";

const initialState: ChangeDestinationState = {};

export function ChangeDestinationForm({
  popular,
  currentName,
  currentTotalKm,
  kmCovered,
}: {
  popular: DestinationOption[];
  currentName: string;
  currentTotalKm: number;
  kmCovered: number;
}) {
  const [state, formAction, pending] = useActionState(
    changeDestination,
    initialState,
  );
  const [destination, setDestination] = useState<DestinationOption | null>(null);
  const [confirming, setConfirming] = useState(false);

  const walked = kmCovered > 0.1;

  return (
    <form action={formAction} className="flex flex-col gap-stack-md">
      <section className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4">
        <p className="text-label-caps uppercase tracking-wide text-on-surface-variant">
          Currently walking to
        </p>
        <p className="mt-1 text-body-lg font-semibold text-on-surface">
          {currentName}
        </p>
        {walked && (
          <p className="mt-1 text-body-md text-on-surface-variant">
            {formatKm(kmCovered)} walked of {formatKm(currentTotalKm)}
          </p>
        )}
      </section>

      {!confirming ? (
        <>
          <div>
            <span className="mb-2 block text-body-md font-semibold text-on-surface">
              Where would you like to walk to instead?
            </span>
            <DestinationPicker
              popular={popular}
              selected={destination}
              onSelect={setDestination}
            />
          </div>

          <button
            type="button"
            disabled={!destination}
            onClick={() => setConfirming(true)}
            className="h-touch-target w-full rounded-full bg-primary-container text-body-lg font-semibold text-on-primary-container active:scale-95 disabled:opacity-50"
          >
            {destination ? "Continue" : "Choose a destination"}
          </button>
        </>
      ) : (
        destination && (
          <>
            <section className="rounded-lg border-2 border-primary-container bg-primary-container/10 p-4">
              <p className="text-label-caps uppercase tracking-wide text-primary">
                New destination
              </p>
              <p className="mt-1 text-body-lg font-semibold text-on-surface">
                {destination.name}
              </p>
              {destination.area && (
                <p className="text-body-md text-on-surface-variant">
                  {destination.area}
                </p>
              )}
              <p className="mt-2 text-body-md font-semibold text-primary">
                ~{formatKm(destination.kmFromOrigin)} from Haridwar ·{" "}
                {formatWalkingTime(destination.kmFromOrigin)} walking
              </p>
            </section>

            {/* State plainly what does and doesn't change — the fear here
                is losing distance already earned. */}
            <ul className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-4">
              <Point icon="check_circle" tone="good">
                {walked
                  ? `Your ${formatKm(kmCovered)} already walked is kept.`
                  : "Your journey so far is kept."}
              </Point>
              <Point icon="route" tone="neutral">
                Your roadmap and milestones are rebuilt for the new route.
              </Point>
              <Point icon="undo" tone="neutral">
                You can switch back to {currentName} later without losing
                progress on either.
              </Point>
            </ul>

            <input
              type="hidden"
              name="destination_id"
              value={destination.id ?? ""}
            />
            <input
              type="hidden"
              name="destination_name"
              value={destination.name}
            />
            <input
              type="hidden"
              name="destination_area"
              value={destination.area ?? ""}
            />
            <input type="hidden" name="destination_lat" value={destination.lat} />
            <input type="hidden" name="destination_lng" value={destination.lng} />

            <button
              type="submit"
              disabled={pending}
              className="h-touch-target w-full rounded-full bg-primary-container text-body-lg font-semibold text-on-primary-container active:scale-95 disabled:opacity-60"
            >
              {pending ? "Planning your route…" : "Confirm change"}
            </button>

            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="h-touch-target w-full rounded-full border-2 border-on-surface/20 text-body-lg font-semibold text-on-surface active:scale-95"
            >
              Back
            </button>
          </>
        )
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}

function Point({
  icon,
  tone,
  children,
}: {
  icon: string;
  tone: "good" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2 text-body-md text-on-surface-variant">
      <span
        className={`material-symbols-outlined text-[18px] ${
          tone === "good" ? "text-primary" : "text-on-surface-variant"
        }`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="flex-1">{children}</span>
    </li>
  );
}
