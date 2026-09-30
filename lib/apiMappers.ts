/**
 * The API speaks snake_case (api-specification.md); every frontend type in
 * lib/types.ts is camelCase. These mappers are the one place that
 * conversion happens, so it's never duplicated (or done inconsistently)
 * per call site.
 */
import type { GeneratedReport, ReportSchedule, Station, StationReading, User } from "./types";

interface ApiStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  particle_device_id: string;
  status: "online" | "offline";
  last_seen_at: string | null;
}

export function mapStation(s: ApiStation): Station {
  return {
    id: s.id,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    particleDeviceId: s.particle_device_id,
    status: s.status,
    lastSeenAt: s.last_seen_at,
  };
}

export interface ApiStationReading {
  /** The API's examples (api-specification.md §5) use `time`; accept
   * `timestamp` too since the hardware payload itself is named that. */
  timestamp?: string;
  time?: string;
  air_temp: number | null;
  bmp_temp: number | null;
  sht_temp: number | null;
  pressure: number | null;
  humidity: number | null;
  max_temp_24h: number | null;
  min_temp_24h: number | null;
  min_tips1: number | null;
  min_rain1_mm: number | null;
  min_tips2: number | null;
  min_rain2_mm: number | null;
  min_avg_rain_mm: number | null;
  yest_rain1_mm: number | null;
  yest_rain2_mm: number | null;
  yest_avg_rain_mm: number | null;
  roll_tips1: number | null;
  roll_rain1_mm: number | null;
  roll_tips2: number | null;
  roll_rain2_mm: number | null;
  roll_avg_rain_mm: number | null;
  // 🟡 Confirmed-forthcoming, not in the payload yet as of this writing
  // (api-specification.md §5) — reads as undefined/null from a real
  // backend today, which correctly renders as "sensor offline" everywhere
  // wind is shown.
  wind_speed_kmh?: number | null;
  wind_direction_deg?: number | null;
}

/** Every field defaults to `null` rather than throwing when the backend
 * hasn't started sending a column yet (wind, most notably) — a missing
 * field should read as "this sensor is offline," not crash the page. */
export function mapReading(r: ApiStationReading): StationReading {
  return {
    timestamp: (r.timestamp ?? r.time) as string,
    airTemp: r.air_temp ?? null,
    bmpTemp: r.bmp_temp ?? null,
    shtTemp: r.sht_temp ?? null,
    pressure: r.pressure ?? null,
    humidity: r.humidity ?? null,
    maxTemp24h: r.max_temp_24h ?? null,
    minTemp24h: r.min_temp_24h ?? null,
    minTips1: r.min_tips1 ?? null,
    minRain1_mm: r.min_rain1_mm ?? null,
    minTips2: r.min_tips2 ?? null,
    minRain2_mm: r.min_rain2_mm ?? null,
    minAvgRain_mm: r.min_avg_rain_mm ?? null,
    yestRain1_mm: r.yest_rain1_mm ?? null,
    yestRain2_mm: r.yest_rain2_mm ?? null,
    yestAvgRain_mm: r.yest_avg_rain_mm ?? null,
    rollTips1: r.roll_tips1 ?? null,
    rollRain1_mm: r.roll_rain1_mm ?? null,
    rollTips2: r.roll_tips2 ?? null,
    rollRain2_mm: r.roll_rain2_mm ?? null,
    rollAvgRain_mm: r.roll_avg_rain_mm ?? null,
    windSpeedKmh: r.wind_speed_kmh ?? null,
    windDirectionDeg: r.wind_direction_deg ?? null,
  };
}

interface ApiUser {
  id: string;
  email: string;
  role: User["role"];
  stations: string[];
  created_at: string;
  // Not in api-specification.md's documented User shape — the backend
  // doesn't track a display name today, only email. Mapped defensively in
  // case it's added later without a frontend change being needed.
  name?: string;
}

/** api-specification.md §3's User object has no `name` field, only
 * `email` — this derives a readable display name from the email's local
 * part (`jane.banda@…` -> `Jane.banda`) as a stand-in wherever the backend
 * doesn't send one, rather than showing a raw email address in a "Name"
 * column. Worth a real product decision (add a name column server-side?)
 * rather than treating this fallback as the permanent answer. */
export function mapUser(u: ApiUser): User {
  const fallbackName = u.email.split("@")[0]?.replace(/[._]/g, " ") ?? u.email;
  return {
    id: u.id,
    name: u.name ?? fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
    email: u.email,
    role: u.role,
    stationIds: u.stations ?? [],
  };
}

interface ApiReportSchedule {
  id: string;
  station_id: string | null;
  frequency: ReportSchedule["frequency"];
  format: ReportSchedule["format"];
  cron_expression: string | null;
  run_at: string | null;
  created_by: string;
}

export function mapReportSchedule(s: ApiReportSchedule): ReportSchedule {
  const runAt = s.run_at ? new Date(s.run_at) : null;
  return {
    id: s.id,
    stationId: s.station_id,
    frequency: s.frequency,
    format: s.format,
    createdBy: s.created_by,
    customDate: runAt ? runAt.toISOString().slice(0, 10) : undefined,
    customTime: runAt ? runAt.toISOString().slice(11, 16) : undefined,
  };
}

interface ApiGeneratedReport {
  id: string;
  schedule_id: string | null;
  station_id: string | null;
  format: GeneratedReport["format"];
  generated_at: string;
}

export function mapGeneratedReport(r: ApiGeneratedReport): GeneratedReport {
  return {
    id: r.id,
    scheduleId: r.schedule_id,
    stationId: r.station_id,
    generatedAt: r.generated_at,
    format: r.format,
    // The API doesn't return a file name separately — the download
    // endpoint is keyed by id, so this is a display-only convenience.
    fileName: `${r.id}.${r.format}`,
  };
}