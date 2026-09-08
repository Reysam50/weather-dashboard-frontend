/**
 * Shape of one telemetry reading from a station, matching the payload
 * suggested in 03-hardware-integration/hardware-team-clarification-request.md.
 *
 * NOTE: this is still pending hardware-team confirmation — if the field
 * names or shape change once they reply, this is the one place to update.
 * Every widget should import this type rather than re-declaring its own
 * field names, so a payload change only means editing this file.
 */
export interface StationReading {
  timestamp: string; // ISO 8601, e.g. "2026-08-19T11:30:00Z"

  // Three independent temperature sensors (redundancy for QA/fault detection)
  airTemp: number;
  bmpTemp: number;
  shtTemp: number;

  pressure: number; // hPa
  humidity: number; // %

  maxTemp24h: number;
  minTemp24h: number;

  // Two independent rain gauges, each reported per-minute, per-yesterday,
  // and as a rolling total, plus an averaged figure across both gauges.
  minTips1: number;
  minRain1_mm: number;
  minTips2: number;
  minRain2_mm: number;
  minAvgRain_mm: number;

  yestRain1_mm: number;
  yestRain2_mm: number;
  yestAvgRain_mm: number;

  rollTips1: number;
  rollRain1_mm: number;
  rollTips2: number;
  rollRain2_mm: number;
  rollAvgRain_mm: number;
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
  /** The hardware doc's "coreid" — pairs a physical Particle Boron to this record. */
  particleDeviceId: string;
  status: "online" | "offline";
  lastSeenAt: string | null; // ISO timestamp, null if it has never reported
}

export type ReportFrequency = "daily" | "weekly" | "monthly" | "custom";
export type ReportFormat = "csv" | "xls" | "xlsx";

/**
 * A configured recurring report (FR-9.1) — matches
 * `POST /api/v1/reports/schedules`. `stationId: null` means "all stations,"
 * which api-specification.md §6 restricts to Administrator/Technical Team;
 * a Station Operator's schedules always have a concrete stationId.
 */
export interface ReportSchedule {
  id: string;
  stationId: string | null;
  frequency: ReportFrequency;
  format: ReportFormat;
  createdBy: string; // display name — lets Admin/Technical Team see who owns what
}

/**
 * One already-generated report file (FR-9.2) — matches
 * `GET /api/v1/reports/generated`. Reports are files sitting in backend
 * storage; there's no email/push delivery in v1, only download/in-app view.
 */
export interface GeneratedReport {
  id: string;
  scheduleId: string;
  stationId: string | null;
  generatedAt: string; // ISO timestamp
  format: ReportFormat;
  fileName: string;
}