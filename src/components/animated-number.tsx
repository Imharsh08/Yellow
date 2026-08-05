"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts smoothly to `value` (FR-7: "real-time, animated display").
 *
 * Animates from whatever is currently shown, so a GPS update eases into
 * the new figure instead of snapping. Respects reduced-motion.
 */
export function AnimatedNumber({
  value,
  className,
  decimals = 1,
  duration = 900,
}: {
  value: number;
  className?: string;
  decimals?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number | null>(null);
  const from = useRef(value);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const origin = from.current;
    const delta = value - origin;

    // Nothing to animate: jump straight there. Scheduled via rAF rather
    // than called inline so this never sets state synchronously in the
    // effect body (which would cascade renders).
    if (reduce || Math.abs(delta) < 0.05) {
      frame.current = requestAnimationFrame(() => {
        from.current = value;
        setDisplay(value);
      });
      return () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
      };
    }

    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(origin + delta * eased);

      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        from.current = value;
      }
    };

    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      from.current = display;
    };
    // `display` is intentionally excluded — including it would restart
    // the animation on every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
}
