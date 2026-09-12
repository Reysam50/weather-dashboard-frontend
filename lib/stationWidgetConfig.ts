const STORAGE_KEY_PREFIX = "station-widgets:";

/**
 * Which widget ids are enabled for a given station — the admin panel's
 * "Widgets" tab writes this, and the dashboard reads it to decide what to
 * render for whichever station is currently selected.
 *
 * Same "browser-only until a real settings API exists" pattern as
 * lib/adminSettings.ts and lib/dashboardLayout.ts.
 *
 * TODO (frontend developer): replace with a real per-station config
 * endpoint once one exists, so this applies account/org-wide instead of
 * per-browser.
 */
export function loadStationWidgetIds(
  stationId: string,
  defaultIds: string[]
): string[] {
  if (typeof window === "undefined") return defaultIds;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + stationId);
    if (!raw) return defaultIds;
    return JSON.parse(raw);
  } catch {
    return defaultIds;
  }
}

export function saveStationWidgetIds(stationId: string, ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_PREFIX + stationId, JSON.stringify(ids));
}

/**
 * Reconciles a saved drag-order against the currently-enabled widget ids:
 * keeps existing order for ids still enabled, drops ids no longer
 * enabled, and appends any newly-enabled ids that aren't in the saved
 * order yet. Needed because which widgets exist for a station can now
 * change at any time (an admin toggling something in the Widgets tab),
 * unlike before when the widget set was one fixed global list.
 */
export function reconcileWidgetOrder(
  savedOrder: string[],
  enabledIds: string[]
): string[] {
  const kept = savedOrder.filter((id) => enabledIds.includes(id));
  const missing = enabledIds.filter((id) => !kept.includes(id));
  return [...kept, ...missing];
}