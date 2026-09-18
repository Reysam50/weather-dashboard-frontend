"use client";

import { useEffect, useState } from "react";

/**
 * Returns false on the server and on the client's first render (so they
 * match), then true after mounting. Use this to gate anything derived
 * from Date.now() / "current time" before it's safe to show — same
 * reasoning as LiveClock.tsx and SseLatencyBadge.tsx, extracted into one
 * hook so every "time ago" display (station last-seen, sync status, etc.)
 * uses the same fix instead of each screen rediscovering the bug.
 *
 * Root cause this works around: lib/mockStations.ts's lastSeenAt values
 * are computed with `Date.now() - N` at module-evaluation time. The
 * server evaluates that module while rendering the page; the browser
 * evaluates it again from scratch during hydration, moments later — so
 * the resulting timestamps (and therefore any "Xm ago" text computed
 * from them during the very first render) don't match, and React's
 * hydration diff fails. Waiting for this hook's true value before
 * rendering the real text avoids ever rendering the mismatched
 * server/client pair in the first place.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}