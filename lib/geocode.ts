export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Forward geocoding via Nominatim (OpenStreetMap's own geocoding service)
 * — free, no API key required, per operations.osmfoundation.org's usage
 * policy (checked current as of September 2026, after two other "free"
 * map services this project relied on — CARTO's tiles, and very nearly
 * Esri's — turned out to require API keys partway through this year).
 *
 * IMPORTANT — the usage policy explicitly forbids auto-complete /
 * search-as-you-type against this endpoint ("this is not yet supported by
 * Nominatim and you must not implement such a service on the client side
 * using the API"), and caps usage at 1 request/second. This function must
 * only ever be called from an explicit user action (submitting a search
 * form) — never from an onChange/keystroke handler. See
 * LocationSearchOverlay in components/map/StationMap.tsx, which only
 * calls this on form submit, not as the person types.
 *
 * The policy also requires a descriptive User-Agent or Referer identifying
 * the calling application. Browser fetch() can't override the User-Agent
 * header, but it does send a Referer automatically — that's the documented
 * way client-side/browser usage satisfies this requirement.
 */
export async function searchLocation(query: string): Promise<GeocodeResult[]> {
  const url = `${NOMINATIM_URL}?format=json&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Nominatim search failed: ${res.status}`);
  }

  const data: { lat: string; lon: string; display_name: string }[] = await res.json();
  return data.map((r) => ({
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    displayName: r.display_name,
  }));
}