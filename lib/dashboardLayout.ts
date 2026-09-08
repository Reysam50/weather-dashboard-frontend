const STORAGE_KEY_PREFIX = "dashboard-widget-order:";

/**
 * Reads a saved widget order from localStorage — but only if it's still a
 * valid permutation of the widgets currently defined on the page. If a
 * widget is later added, removed, or renamed, a stale saved order (missing
 * or extra ids) is discarded automatically and the default order is used
 * instead, rather than silently dropping a widget from view.
 *
 * There's no backend "user preferences" endpoint yet, so this lives in the
 * browser for now. TODO (frontend developer): once one exists, swap these
 * two functions for API calls and this becomes a non-issue across devices.
 */
export function loadWidgetOrder(
  storageKey: string,
  defaultOrder: string[]
): string[] {
  if (typeof window === "undefined") return defaultOrder; // SSR guard

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + storageKey);
    if (!raw) return defaultOrder;

    const saved: string[] = JSON.parse(raw);
    const isValidPermutation =
      saved.length === defaultOrder.length &&
      defaultOrder.every((id) => saved.includes(id));

    return isValidPermutation ? saved : defaultOrder;
  } catch {
    return defaultOrder;
  }
}

export function saveWidgetOrder(storageKey: string, order: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_PREFIX + storageKey, JSON.stringify(order));
}