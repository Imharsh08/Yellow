"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation } from "@/lib/use-geolocation";
import { POI_CATEGORIES, POI_META, type PoiCategory } from "@/lib/types";

/**
 * POI submission (FR-4): category, photo, geo-tag and a short note.
 *
 * The photo is downscaled in the browser before upload. NFR §7 requires
 * uploads under 10s on 3G/4G, and a modern phone camera JPEG is several
 * megabytes — far too slow on the route without this step.
 */
export function ReportForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { position, error: geoError } = useGeolocation();
  const fileInput = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<PoiCategory>("bhojan_shivir");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!position) {
      setError(
        "We need your location to place this point. Turn on location and try again.",
      );
      return;
    }
    if (title.trim().length < 2) {
      setError("Give the point a short name.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      let photoUrl: string | null = null;

      if (file) {
        const compressed = await downscale(file);
        const path = `${userId}/${crypto.randomUUID()}.jpg`;

        const { error: upErr } = await supabase.storage
          .from("poi-photos")
          .upload(path, compressed, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);

        photoUrl = supabase.storage.from("poi-photos").getPublicUrl(path)
          .data.publicUrl;
      }

      const { error: insErr } = await supabase.from("pois").insert({
        user_id: userId,
        category,
        title: title.trim(),
        note: note.trim() || null,
        lat: position.lat,
        lng: position.lng,
        photo_url: photoUrl,
      });

      if (insErr) throw new Error(insErr.message);

      router.push("/map");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-stack-md">
      {/* Category */}
      <fieldset>
        <legend className="mb-2 text-body-md font-semibold text-on-surface">
          What is it?
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {POI_CATEGORIES.map((c) => {
            const meta = POI_META[c];
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={`flex min-h-touch-target items-center gap-2 rounded-lg border-2 px-3 text-left text-body-md font-semibold transition-colors ${
                  active
                    ? "border-primary-container bg-primary-container/15 text-on-surface"
                    : "border-outline-variant/60 text-on-surface-variant"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: meta.pin }}
                  aria-hidden="true"
                >
                  {meta.icon}
                </span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-body-md font-semibold text-on-surface"
        >
          Name
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          placeholder="e.g. Shiv Shakti Bhojan Shivir"
          className="h-touch-target w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:ring-[3px] focus:ring-primary-container"
        />
      </div>

      {/* Note */}
      <div>
        <label
          htmlFor="note"
          className="mb-2 block text-body-md font-semibold text-on-surface"
        >
          Details <span className="font-normal text-on-surface-variant">(optional)</span>
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Timings, what's available, anything useful"
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:ring-[3px] focus:ring-primary-container"
        />
      </div>

      {/* Photo */}
      <div>
        <span className="mb-2 block text-body-md font-semibold text-on-surface">
          Photo <span className="font-normal text-on-surface-variant">(optional)</span>
        </span>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPickFile}
          className="hidden"
        />
        {preview ? (
          <div className="relative overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Selected photo preview"
              className="h-48 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
                if (fileInput.current) fileInput.current.value = "";
              }}
              className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Remove photo"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant active:scale-[0.99]"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              add_a_photo
            </span>
            <span className="text-body-md">Take a photo</span>
          </button>
        )}
      </div>

      {/* Location status */}
      <div className="flex items-start gap-2 rounded-lg bg-surface-container-low p-3">
        <span
          className={`material-symbols-outlined text-[20px] ${
            position ? "text-primary" : "text-on-surface-variant"
          }`}
          aria-hidden="true"
        >
          {position ? "location_on" : "location_searching"}
        </span>
        <p className="flex-1 text-body-md text-on-surface-variant">
          {position
            ? `This point will be placed at your current location (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}).`
            : (geoError ?? "Finding your location…")}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !position}
        className="h-touch-target w-full rounded-full bg-primary-container text-body-lg font-semibold text-on-primary-container shadow-[0_4px_20px_rgba(255,153,51,0.25)] active:scale-95 disabled:opacity-50"
      >
        {submitting ? "Sharing…" : "Share with everyone"}
      </button>
    </form>
  );
}

/**
 * Downscales to max 1280px on the long edge and re-encodes as JPEG q0.75.
 * Typically turns a 4MB camera shot into ~200KB, which uploads in a couple
 * of seconds on 3G instead of timing out.
 */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const MAX = 1280;
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      "image/jpeg",
      0.75,
    );
  });
}
