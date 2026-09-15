"use client";

import { useEffect, useState } from "react";

/**
 * Two-line CAT / UTC clock for the header's right-hand cluster — matches
 * the Live Telemetry redesign (source of truth for the header). Stations
 * are in Malawi, hence CAT (Central Africa Time, UTC+2) as the primary
 * zone with UTC underneath for cross-referencing telemetry timestamps,
 * which the backend stores in UTC.
 *
 * Starts as null for the same hydration-mismatch reason as before: the
 * server can't know "now" in a way that will exactly match the client's
 * first paint, so the real time only appears after mounting.
 */
export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div className="hidden xl:flex flex-col items-end px-2.5 py-1 rounded-xl bg-card-bg border border-border-line font-mono leading-tight">
        <span className="text-xs font-semibold text-secondary tabular-nums">--:--:--</span>
        <span className="text-[9px] text-on-surface-variant tabular-nums">--:--:-- UTC</span>
      </div>
    );
  }

  const catTime = now.toLocaleTimeString("en-GB", {
    timeZone: "Africa/Blantyre",
    hour12: false,
  });
  const utcTime = now.toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour12: false,
  });

  return (
    <div className="hidden xl:flex flex-col items-end px-2.5 py-1 rounded-xl bg-card-bg border border-border-line font-mono leading-tight">
      <div className="flex items-center gap-1 text-xs font-semibold text-secondary tabular-nums">
        <span>{catTime}</span>
        <span className="text-[9px] text-amber-300/70">CAT</span>
      </div>
      <div className="text-[9px] text-on-surface-variant tabular-nums">{utcTime} UTC</div>
    </div>
  );
}
