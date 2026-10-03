/**
 * Pure helpers + types shared by the Live Dashboard's derived data
 * (lib/deriveStationView.ts, which turns real API readings into these
 * shapes) and by leaf components for display formatting. Nothing in this
 * file reads mock data or fabricates readings anymore — see
 * deriveStationView.ts for where real telemetry becomes these shapes, and
 * deriveStationView.ts's own header comment for the one exception
 * (7-day forecast has no data source at all, real or mock, so it's a
 * clearly-labeled placeholder generated here).
 */

const round1 = (n: number) => Number(n.toFixed(1));
const round2 = (n: number) => Number(n.toFixed(2));

/** Simple Magnus-formula dew point / vapor pressure — good enough for this
 * display card, not meant to be meteorologically precise. Returns `null`
 * when either input is missing rather than computing a misleading number
 * from a stale/absent reading. */
export function dewPointC(tempC: number | null, relHumidityPct: number | null): number | null {
  if (tempC === null || relHumidityPct === null || relHumidityPct <= 0) return null;
  const a = 17.27;
  const b = 237.3;
  const alpha = (a * tempC) / (b + tempC) + Math.log(relHumidityPct / 100);
  return round1((b * alpha) / (a - alpha));
}

export function vaporPressureKPa(dewC: number | null): number | null {
  if (dewC === null) return null;
  return round2(0.6108 * Math.exp((17.27 * dewC) / (dewC + 237.3)));
}

export function degToCompass(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export interface SensorAgreement {
  /** BMP360 diagnostic reading minus the primary MCP9808 air temp. */
  bmpDeltaC: number;
  /** SHT31 diagnostic reading minus the primary MCP9808 air temp. */
  shtDeltaC: number;
  /** Larger of the two |delta| values — what actually gets compared
   * against the configured tolerance. */
  maxAbsDeltaC: number;
  /** Max − min across all three raw readings. */
  spreadC: number;
  status: "OPTIMAL" | "DEGRADED";
}

/**
 * Computes real-time sensor agreement from the three live temperature
 * readings against a caller-supplied tolerance (lib/adminSettings.ts's
 * sensorAgreementToleranceC, via AdminSettingsContext). Returns `null`
 * when any of the three sensors isn't currently reporting — an
 * agreement/disagreement verdict needs all three, and a missing sensor is
 * a different (and more serious) card state than "in agreement."
 */
export function computeSensorAgreement(
  airTempC: number | null,
  bmpTempC: number | null,
  shtTempC: number | null,
  toleranceC: number
): SensorAgreement | null {
  if (airTempC === null || bmpTempC === null || shtTempC === null) return null;
  const bmpDeltaC = round2(bmpTempC - airTempC);
  const shtDeltaC = round2(shtTempC - airTempC);
  const maxAbsDeltaC = round2(Math.max(Math.abs(bmpDeltaC), Math.abs(shtDeltaC)));
  const values = [airTempC, bmpTempC, shtTempC];
  const spreadC = round2(Math.max(...values) - Math.min(...values));
  return {
    bmpDeltaC,
    shtDeltaC,
    maxAbsDeltaC,
    spreadC,
    status: maxAbsDeltaC <= toleranceC ? "OPTIMAL" : "DEGRADED",
  };
}

export interface ForecastDay {
  label: string;
  icon: string;
  iconColor: string;
  high: number;
  low: number;
  rainMm: number;
}

export interface IngestLogRow {
  time: string; // "15:58:00"
  airTemp: number | null;
  bmpTemp: number | null;
  shtTemp: number | null;
  humidity: number | null;
  pressure: number | null;
  /** Rain in this one-minute row, averaged across both gauges — matches
   * minAvgRain_mm in the real hardware payload. */
  minuteRain_mm: number | null;
  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
  /** Whether every field above was present in this row's raw reading —
   * replaces an earlier fabricated 0.00-1.00 "QA score" that had no real
   * data quality signal behind it. This is an honest (if blunt) stand-in:
   * "did the station send something for every channel this minute," not a
   * real data-quality/checksum verdict — see api-specification.md §9.3's
   * `qaFlag` export channel for where a real one would need to come from. */
  qaOk: boolean;
}

export interface LiveTelemetryExtras {
  dewPoint: number | null;
  vaporPressureKPa: number | null;
  rain6hBuckets: number[]; // 6 buckets across the last 24h
  rainWeeklyTotalMm: number | null;
  rainVariancePct: number | null;
  pressureTrend3h: number | null;
  pressureStabilityLabel: string;
  wind: {
    speedKmh: number | null;
    directionDeg: number | null;
    compass: string | null;
    bearingStable: boolean;
  };
  /** Wind speed/direction across the same hourLabels buckets used by
   * StationView's tempHistory/humidityHistory/pressureHistory, for
   * the Compare screen's wind trend chart and matrix table. Gaps (a
   * reading with no wind value) are dropped rather than plotted as 0. */
  windSpeedHistory: number[];
  windDirectionHistory: number[];
  /** Not derived from telemetry — there is no forecast data source (real
   * or otherwise) in this project's API. Synthetic placeholder, clearly
   * separate from every other field on this type, which now all come from
   * real readings. See deriveStationView.ts. */
  forecast7Day: ForecastDay[];
  ingestLog: IngestLogRow[];
  totalReadingsCount: number;
}

const FORECAST_ICONS: { icon: string; color: string }[] = [
  { icon: "sunny", color: "text-secondary" },
  { icon: "partly_cloudy_day", color: "text-cyan-400" },
  { icon: "rainy", color: "text-blue-400" },
  { icon: "thunderstorm", color: "text-purple-400" },
  { icon: "sunny", color: "text-secondary" },
  { icon: "wb_sunny", color: "text-amber-400" },
  { icon: "cloud", color: "text-cyan-400" },
];

/** No forecast endpoint exists anywhere in this project's API — this isn't
 * "mock data standing in for telemetry," it's a placeholder for a feature
 * (weather forecasting) that was never actually commissioned. Seeded only
 * by station id + today's date, so it's at least stable across a session
 * rather than reshuffling on every render. */
export function buildPlaceholderForecast(stationId: string): ForecastDay[] {
  const seed = stationId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 7;
  const today = new Date();
  const rainPattern = [0, 0, 12, 18, 0.2, 0, 1.4];

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const label =
      i === 0 ? "TOD" : date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3).toUpperCase();
    const wobble = Math.sin(seed + i) * 1.5;
    const { icon, color } = FORECAST_ICONS[(i + seed) % FORECAST_ICONS.length];

    return {
      label,
      icon,
      iconColor: color,
      high: round1(29 - i * 0.6 + wobble),
      low: round1(19 - i * 0.4 + wobble * 0.5),
      rainMm: round1(Math.max(0, rainPattern[i])),
    };
  });
}