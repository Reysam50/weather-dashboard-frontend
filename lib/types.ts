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

  airTemp: number;
  bmpTemp: number;
  shtTemp: number;

  pressure: number; // hPa
  humidity: number; // %

  maxTemp24h: number;
  minTemp24h: number;

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
  particleDeviceId: string;
  status: "online" | "offline";
  lastSeenAt: string | null;
}

export type ReportFrequency = "daily" | "weekly" | "monthly" | "custom";
export type ReportFormat = "csv" | "xls" | "xlsx";

export interface ReportSchedule {
  id: string;
  stationId: string | null;
  frequency: ReportFrequency;
  format: ReportFormat;
  createdBy: string;
}

export interface GeneratedReport {
  id: string;
  scheduleId: string;
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
export interface User {
  id: string;
  name: string;
  email: string;
  role: "station_operator" | "administrator" | "technical_team";
  stationIds: string[];
}