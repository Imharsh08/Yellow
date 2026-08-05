"use client";

import { useActionState, useState } from "react";
import { completeOnboarding, type OnboardingState } from "./actions";
import { DestinationPicker } from "@/components/destination-picker";
import type { DestinationOption } from "./search-destinations";

const initialState: OnboardingState = {};

export function OnboardingForm({
  suggestedName,
  popular,
}: {
  suggestedName: string;
  popular: DestinationOption[];
}) {
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initialState,
  );
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [destination, setDestination] = useState<DestinationOption | null>(null);

  // FR-2: location permission is requested at onboarding. Asking here —
  // with the reason visible on screen — converts far better than a cold
  // browser prompt on the dashboard.
  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setLocationGranted(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setLocationGranted(true),
      () => setLocationGranted(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-stack-md">
      <div>
        <label
          htmlFor="full_name"
          className="mb-2 block text-body-md font-semibold text-on-surface"
        >
          Your name
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={suggestedName}
          autoComplete="name"
          placeholder="Ramesh Kumar"
          className="h-touch-target w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:ring-[3px] focus:ring-primary-container"
        />
        <p className="mt-2 text-body-md text-on-surface-variant">
          This appears on your completion certificate.
        </p>
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-body-md font-semibold text-on-surface"
        >
          Contact number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          className="h-touch-target w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:ring-[3px] focus:ring-primary-container"
        />
      </div>

      <div>
        <span className="mb-2 block text-body-md font-semibold text-on-surface">
          Where are you walking to?
        </span>
        <DestinationPicker
          popular={popular}
          selected={destination}
          onSelect={setDestination}
        />

        {/* The picker is a controlled component, so the chosen values are
            carried into the form action as hidden fields. */}
        {destination && (
          <>
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
          </>
        )}
      </div>

      {/* FR-2: location permission, with the reason stated up front. */}
      <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low p-4">
        <div className="flex items-start gap-3">
          <span
            className="material-symbols-outlined text-primary"
            aria-hidden="true"
          >
            my_location
          </span>
          <div className="flex-1">
            <p className="text-body-md font-semibold text-on-surface">
              Allow location access
            </p>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Needed to show how far you&apos;ve walked and what&apos;s nearby.
              Used only inside the app.
            </p>

            {locationGranted === true ? (
              <p className="mt-stack-sm flex items-center gap-1.5 text-body-md font-semibold text-primary">
                <span
                  className="material-symbols-outlined icon-filled text-[18px]"
                  aria-hidden="true"
                >
                  check_circle
                </span>
                Location enabled
              </p>
            ) : (
              <button
                type="button"
                onClick={requestLocation}
                className="mt-stack-sm h-11 rounded-full border-2 border-on-surface/20 px-5 text-body-md font-semibold text-on-surface active:scale-95"
              >
                {locationGranted === false ? "Try again" : "Enable location"}
              </button>
            )}

            {locationGranted === false && (
              <p className="mt-2 text-body-md text-on-surface-variant">
                You can continue without it, but distance tracking won&apos;t
                work.
              </p>
            )}
          </div>
        </div>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !destination}
        className="h-touch-target w-full rounded-full bg-primary-container text-body-lg font-semibold text-on-primary-container shadow-[0_4px_20px_rgba(255,153,51,0.25)] active:scale-95 disabled:opacity-60"
      >
        {pending
          ? "Planning your yatra…"
          : destination
            ? "Start my yatra"
            : "Choose your destination"}
      </button>

      <p className="text-center text-body-md text-on-surface-variant">
        Your location and contact details are used only for app features.
      </p>
    </form>
  );
}
