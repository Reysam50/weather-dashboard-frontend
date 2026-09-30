/**
 * Shape of one telemetry reading from a station, matching the confirmed
 * hardware payload (03-hardware-integration/hardware-team-clarification-request.md,
 * api-specification.md §5).
 *
 * Every sensor field is nullable: a reading still arrives on schedule even
 * when one sensor is degraded or disconnected (the station itself is
 * online, one channel isn't) — `null` means "this sensor reported nothing
 * this cycle," and is what drives each dashboard card's own offline state
 * (see components/layout/OfflineNotice.tsx), independent of whether the
 * station as a whole is reachable at all.
 *
 * windSpeedKmh/windDirectionDeg: confirmed by the hardware team as a
 * forthcoming field (not in the payload yet as of this writing) — wired up
 * end-to-end already so no frontend change is needed once it starts
 * arriving; until then it will simply always read `null` from a real
 * backend, which renders correctly as "sensor offline" on every card that
 * shows it.
 */
export interface StationReading {
  timestamp: string; // ISO 8601, e.g. "2026-08-19T11:30:00Z"

  airTemp: number | null;
  bmpTemp: number | null;
  shtTemp: number | null;

  pressure: number | null; // hPa
  humidity: number | null; // %

  maxTemp24h: number | null;
  minTemp24h: number | null;

  minTips1: number | null;
  minRain1_mm: number | null;
  minTips2: number | null;
  minRain2_mm: number | null;
  minAvgRain_mm: number | null;

  yestRain1_mm: number | null;
  yestRain2_mm: number | null;
  yestAvgRain_mm: number | null;

  rollTips1: number | null;
  rollRain1_mm: number | null;
  rollTips2: number | null;
  rollRain2_mm: number | null;
  rollAvgRain_mm: number | null;

  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
}

/**
 * Matches the `stations` table in database-design.md §2. `status` and
 * `lastSeenAt` are derived/computed on the backend (from the latest
 * telemetry timestamp), not something the frontend sets directly.
 */
export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  particleDeviceId: string;
  status: "online" | "offline";
  lastSeenAt: string | null;
}

export type ReportFrequency = "daily" | "weekly" | "monthly" | "custom";
export type ReportFormat = "csv" | "xls" | "xlsx" | "pdf";

export interface ReportSchedule {
  id: string;
  stationId: string | null;
  frequency: ReportFrequency;
  format: ReportFormat;
  createdBy: string;
  /** Only set when frequency is "custom" — a specific run date (YYYY-MM-DD)
   * and time-of-day (HH:MM, 24h), since "Custom" previously had no way to
   * actually pick either. */
  customDate?: string;
  customTime?: string;
}

export interface GeneratedReport {
  id: string;
  /** null for a one-off manual/Quick Export generation not tied to any
   * recurring schedule (api-specification.md §6). */
  scheduleId: string | null;
  stationId: string | null;
  generatedAt: string;
  format: ReportFormat;
  fileName: string;
}

/**
 * Matches GET/POST/PATCH /users (api-specification.md §3). `stationIds`
 * only means anything for role "station_operator" — Administrator and
 * Technical Team implicitly see every station, so assigning them to
 * specific ones has no effect (per stakeholder-analysis.md's permission
 * table) and the admin UI hides that control for those roles.
 */
/**
 * Shared status for every data-fetching hook in lib/ — "offline" is
 * specifically "we successfully reached the API but it has nothing for us
 * (e.g. a station that's never reported)", distinct from "error" (the
 * request itself failed — network down, 5xx, etc.), so the UI can tell
 * "this station has no data" apart from "something is actually broken."
 */
export type FetchStatus = "loading" | "ready" | "offline" | "error";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "station_operator" | "administrator" | "technical_team";
  stationIds: string[];
}