const STORAGE_KEY = "admin-settings";

export interface AdminSettings {
  mapTheme: "light" | "dark";
  /** How often stations push telemetry — also read by the header's
   * SseLatencyBadge so the "…s INT" label reflects the real setting
   * instead of a hardcoded 60. */
  pollingIntervalSec: 30 | 60 | 300;
  fallbackTelemetryEnabled: boolean;
  sdBackpressureEnabled: boolean;
  mtlsEnabled: boolean;
  /** Max acceptable difference (°C) between the primary MCP9808 air-temp
   * reading and each diagnostic sensor (BMP360, SHT31) before the Live
   * Dashboard's Sensor Agreement panel flags it as degraded. Previously
   * hardcoded to 0.8 in the dashboard itself — now a real setting so it
   * isn't buried in component code. */
  sensorAgreementToleranceC: number;
  /** Max acceptable % difference between the two 451A rain gauges before
   * the dashboard's dual-gauge card flags a variance warning. Previously
   * hardcoded to 5 in the component. */
  rainGaugeVarianceTolerancePct: number;
}

export const DEFAULT_SETTINGS: AdminSettings = {
  mapTheme: "dark",
  pollingIntervalSec: 60,
  fallbackTelemetryEnabled: true,
  sdBackpressureEnabled: true,
  mtlsEnabled: true,
  sensorAgreementToleranceC: 0.8,
  rainGaugeVarianceTolerancePct: 5,
};

/**
 * Reads system-wide settings from localStorage, falling back to defaults
 * for anything never set — same "browser-only until a real settings API
 * exists" pattern as lib/stationHardware.ts and friends.
 *
 * TODO (frontend developer): replace with GET/PATCH /settings once that
 * endpoint exists, so settings apply account/org-wide instead of
 * per-browser. Right now if you open this app in a different browser,
 * you'll see the default theme again.
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}