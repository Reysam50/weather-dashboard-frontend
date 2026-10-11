import { apiFetch } from "./api";

const STORAGE_KEY = "admin-settings";

export interface AdminSettings {
  mapTheme: "light" | "dark";
  /** Max acceptable difference (°C) between the primary MCP9808 air-temp
   * reading and each diagnostic sensor (BMP390, SHT31) before the Live
   * Dashboard's Sensor Agreement panel flags it as degraded. */
  sensorAgreementToleranceC: number;
  /** Max acceptable % difference between the two rain gauges before the
   * dashboard's dual-gauge card flags a variance warning. */
  rainGaugeVarianceTolerancePct: number;
}

export const DEFAULT_SETTINGS: AdminSettings = {
  mapTheme: "dark",
  sensorAgreementToleranceC: 0.8,
  rainGaugeVarianceTolerancePct: 5,
};

/**
 * Wire format of GET/PATCH /settings (backend views_settings.py — camelCase,
 * unlike users/schedules). The backend row also has `frequency`,
 * `fallbackModel`, `sdBackpressure` and `mtlsVerify`; no screen uses those
 * any more, so they're neither read nor sent here.
 *
 * `basemap` maps onto our `mapTheme`. The two tolerance fields are NOT in
 * the backend yet — it has to add them (11-screen-sync/admin.md). Until it
 * does, GET simply omits them and PATCH's unknown keys are ignored.
 */
export interface ApiSettings {
  basemap?: "dark" | "light" | "satellite";
  sensorAgreementToleranceC?: number;
  rainGaugeVarianceTolerancePct?: number;
}

/** Overlays what the server returned onto `base`. A field the server didn't
 * send keeps `base`'s value (see the cache note on loadAdminSettings).
 * "satellite" has no UI yet (Settings shows it as coming soon), so it
 * falls back to the dark map. */
export function settingsFromApi(raw: ApiSettings, base: AdminSettings): AdminSettings {
  return {
    mapTheme: raw.basemap === undefined ? base.mapTheme : raw.basemap === "light" ? "light" : "dark",
    sensorAgreementToleranceC:
      typeof raw.sensorAgreementToleranceC === "number" ? raw.sensorAgreementToleranceC : base.sensorAgreementToleranceC,
    rainGaugeVarianceTolerancePct:
      typeof raw.rainGaugeVarianceTolerancePct === "number"
        ? raw.rainGaugeVarianceTolerancePct
        : base.rainGaugeVarianceTolerancePct,
  };
}

export function settingsToApi(s: AdminSettings): Required<ApiSettings> {
  return {
    basemap: s.mapTheme,
    sensorAgreementToleranceC: s.sensorAgreementToleranceC,
    rainGaugeVarianceTolerancePct: s.rainGaugeVarianceTolerancePct,
  };
}

/** GET /settings — readable by any signed-in user. */
export async function fetchRemoteSettings(base: AdminSettings): Promise<AdminSettings> {
  const raw = await apiFetch<ApiSettings>("/settings");
  return settingsFromApi(raw, base);
}

/** PATCH /settings — Administrator / Technical Team only (403 otherwise).
 * Throws ApiError on failure. */
export async function saveRemoteSettings(next: AdminSettings): Promise<AdminSettings> {
  const raw = await apiFetch<ApiSettings>("/settings", {
    method: "PATCH",
    body: JSON.stringify(settingsToApi(next)),
  });
  // Fields the server doesn't store yet fall back to what we just sent.
  return settingsFromApi(raw, next);
}

/**
 * localStorage is now only a CACHE of the last-known settings: it gives the
 * first paint something sensible before GET /settings answers, and keeps the
 * app usable if that request fails. The server is the source of truth — it
 * overwrites this on every load. It also carries the two tolerance values
 * until the backend stores them, so they don't reset on reload meanwhile.
 */
export function loadAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAdminSettings(settings: AdminSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full/blocked — it's only a cache.
  }
}
