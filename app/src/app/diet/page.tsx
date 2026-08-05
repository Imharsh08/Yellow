import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

/**
 * FR-10: free, static diet plan for a multi-day walking pilgrimage.
 *
 * Content is general nutrition guidance for sustained walking in Sawan
 * heat, written to respect the sattvic restrictions most kanwariyas keep
 * (no onion, garlic, or non-vegetarian food during the yatra).
 */
const SECTIONS = [
  {
    title: "Before you set off",
    icon: "wb_twilight",
    items: [
      "Eat a proper meal 1–2 hours before walking, not right before.",
      "Soak 4–5 almonds and 2 dates overnight — quick energy on the road.",
      "Fill every bottle you carry. Water is heavier than you think, and worth it.",
    ],
  },
  {
    title: "While walking",
    icon: "directions_walk",
    items: [
      "Sip water every 20–30 minutes. Don't wait until you feel thirsty.",
      "A pinch of salt and sugar in water works as ORS when you're sweating hard.",
      "Nimbu paani, coconut water, chaach or lassi at shivirs replace lost salts.",
      "Keep gud (jaggery), roasted chana or peanuts in your pocket for slow energy.",
      "Seasonal fruit — banana, papaya, melon — is easy to digest while moving.",
    ],
  },
  {
    title: "At bhojan shivirs",
    icon: "restaurant",
    items: [
      "Khichdi, dal-chawal and roti-sabzi are ideal: light, cooked, and filling.",
      "Eat until comfortable, not full. A heavy stomach makes the next stretch harder.",
      "Curd or buttermilk with a meal cools the body and helps digestion.",
      "Prefer freshly cooked, hot food. Give anything sitting out in the heat a miss.",
    ],
  },
  {
    title: "Rest and recovery",
    icon: "bedtime",
    items: [
      "Eat something within an hour of stopping for the night — it speeds recovery.",
      "Warm milk with haldi before sleeping helps sore muscles.",
      "Keep the night meal light so you sleep well and wake without heaviness.",
    ],
  },
  {
    title: "Best avoided",
    icon: "block",
    items: [
      "Deep-fried and very oily food — heavy in the heat, slow to digest.",
      "Cut fruit or juice from open stalls, and any water you're unsure about.",
      "Too much tea or coffee — both dehydrate you further.",
      "Alcohol and tobacco, which work against you on a long walk.",
    ],
  },
] as const;

export default function DietPage() {
  return (
    <>
      <TopBar title="Diet Plan" />
      <main className="mx-auto w-full max-w-lg flex-1 px-margin-mobile pb-[100px] pt-[72px]">
        <p className="py-stack-md text-body-lg text-on-surface-variant">
          Walking 20–30 km a day in Sawan heat asks a lot of your body. Eat
          light, drink often, and don&apos;t skip meals.
        </p>

        <div className="flex flex-col gap-stack-md">
          {SECTIONS.map((s) => (
            <section
              key={s.title}
              className="rounded-xl border border-outline-variant/30 bg-surface p-4"
            >
              <h2 className="flex items-center gap-2 text-title-md font-semibold text-on-surface">
                <span
                  className="material-symbols-outlined text-primary"
                  aria-hidden="true"
                >
                  {s.icon}
                </span>
                {s.title}
              </h2>
              <ul className="mt-stack-sm flex flex-col gap-2">
                {s.items.map((it) => (
                  <li key={it} className="flex gap-2 text-body-lg text-on-surface-variant">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary-container"
                      aria-hidden="true"
                    />
                    {it}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-stack-md rounded-lg bg-error-container p-4">
          <p className="text-body-md text-on-error-container">
            <strong>If you feel dizzy, stop sweating, or get a bad
            headache</strong> — stop walking, get into shade, and go to the
            nearest medical point. Heat exhaustion gets serious quickly.
          </p>
          <Link
            href="/services/medical_point"
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-on-error-container px-4 font-semibold text-error-container"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              local_hospital
            </span>
            Find medical points
          </Link>
        </div>

        <p className="py-stack-md text-center text-body-md text-on-surface-variant">
          General guidance only — follow your own doctor&apos;s advice if it
          differs.
        </p>
      </main>
      <BottomNav />
    </>
  );
}
