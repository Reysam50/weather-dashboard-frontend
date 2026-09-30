import type { Station, StationReading } from "./types";
import { getStationHardware } from "./stationHardware";
import { computeMetricStats, type MetricStats } from "./comparisonMetrics";

/** stationId -> readings, oldest first (see lib/useCompareData.ts) */
export type ReadingsByStation = Record<string, StationReading[]>;

type NumericField = {
  [K in keyof StationReading]: StationReading[K] extends number | null ? K : never;
}[keyof StationReading];

/** Non-null values of one field across a station's readings — gaps are
 * dropped, never plotted as zero. */
export function fieldSeries(readings: StationReading[] | undefined, field: NumericField): number[] {
  return (readings ?? []).map((r) => r[field]).filter((v): v is number => v !== null);
}

function lastValue(readings: StationReading[] | undefined, field: NumericField): number | null {
  const values = fieldSeries(readings, field);
  return values.length ? values[values.length - 1] : null;
}

/** Cyan for the first online station, then amber/purple/green for
 * additional ones — same convention as the station map's markers. */
const ONLINE_PALETTE = ["#00e5ff", "#ffb95f", "#d0bcff", "#34d399"];
export const OFFLINE_COLOR = "#849396";

export function assignStationColors(stations: Station[]): Record<string, string> {
  const colors: Record<string, string> = {};
  let onlineIdx = 0;
  for (const s of stations) {
    if (s.status === "offline") {
      colors[s.id] = OFFLINE_COLOR;
    } else {
      colors[s.id] = ONLINE_PALETTE[onlineIdx % ONLINE_PALETTE.length];
      onlineIdx++;
    }
  }
  return colors;
}

export interface Finding {
  icon: string;
  color: string;
  label: string;
  text: string;
}

export function buildFindings(stations: Station[], hourly: ReadingsByStation): Finding[] {
  const findings: Finding[] = [];
  const online = stations.filter((s) => s.status === "online");
  const offline = stations.filter((s) => s.status === "offline");

  if (online.length >= 2) {
    const withElev = online
      .map((s) => ({ s, elev: getStationHardware(s.id).elevationM, temp: lastValue(hourly[s.id], "airTemp") }))
      .filter((x): x is { s: Station; elev: number; temp: number } => x.temp !== null)
      .sort((a, b) => a.elev - b.elev);
    const lowest = withElev[0];
    const highest = withElev[withElev.length - 1];
    const delta = lowest && highest ? Number((highest.temp - lowest.temp).toFixed(1)) : 0;
    const elevDelta = lowest && highest ? highest.elev - lowest.elev : 0;

    if (withElev.length < 2) {
      // not enough stations currently reporting a temperature to compare
    } else if (delta > 0) {
      findings.push({
        icon: "thermostat",
        color: "text-secondary",
        label: "Thermal Inversion",
        text: `${highest.s.name} (+${elevDelta}m) is +${delta}°C warmer than ${lowest.s.name}`,
      });
    } else {
      findings.push({
        icon: "thermostat",
        color: "text-primary-container",
        label: "Lapse Rate Normal",
        text: `${highest.s.name} (+${elevDelta}m) is ${Math.abs(delta)}°C cooler than ${lowest.s.name}, as expected with altitude`,
      });
    }
  }

  if (online.length >= 1) {
    const pressures = fieldSeries(hourly[online[0].id], "pressure");
    if (pressures.length >= 2) {
      const first = pressures[0];
      const last = pressures[pressures.length - 1];
      const hours = pressures.length;
      const trend = Number((last - first).toFixed(1));
      findings.push({
        icon: "air",
        color: "text-primary-container",
        label: "Barometric Front",
        text:
          trend === 0
            ? `Pressure holding steady across the last ${hours}h window`
            : `Uniform ${Math.abs(trend)} hPa ${trend < 0 ? "drop" : "rise"} over the ${hours}-hour cycle`,
      });
    }
  }

  if (offline.length > 0) {
    const s = offline[0];
    const hoursOffline = s.lastSeenAt
      ? Math.max(0, Math.floor((Date.now() - new Date(s.lastSeenAt).getTime()) / 3600000))
      : null;
    findings.push({
      icon: "cloud_off",
      color: "text-error",
      label: `${s.name} Telemetry Gap`,
      text:
        hoursOffline !== null
          ? `Offline ${hoursOffline}h — no telemetry being received`
          : "Offline — no telemetry being received",
    });
  } else if (online.length > 0) {
    findings.push({
      icon: "check_circle",
      color: "text-primary-container",
      label: "All Systems Nominal",
      text: `${online.length} of ${stations.length} selected stations reporting live telemetry`,
    });
  }

  return findings.slice(0, 3);
}

export interface MatrixRow {
  key: string;
  label: string;
  icon: string;
  unit: string;
  perOnlineStation: Record<string, MetricStats>;
  perOfflineStation: Record<string, number | null>;
}

export function buildMatrixRows(stations: Station[], hourly: ReadingsByStation): MatrixRow[] {
  const online = stations.filter((s) => s.status === "online");
  const offline = stations.filter((s) => s.status === "offline");

  function buildRow(
    key: string,
    label: string,
    icon: string,
    unit: string,
    getSeries: (id: string) => number[],
    getOfflineEstimate: (id: string) => number | null
  ): MatrixRow {
    const perOnlineStation: MatrixRow["perOnlineStation"] = {};
    online.forEach((s) => {
      perOnlineStation[s.id] = computeMetricStats(getSeries(s.id));
    });
    const perOfflineStation: MatrixRow["perOfflineStation"] = {};
    offline.forEach((s) => {
      perOfflineStation[s.id] = getOfflineEstimate(s.id);
    });

    return { key, label, icon, unit, perOnlineStation, perOfflineStation };
  }

  const row = (
    key: string,
    label: string,
    icon: string,
    unit: string,
    field: NumericField
  ) =>
    buildRow(
      key,
      label,
      icon,
      unit,
      (id) => fieldSeries(hourly[id], field),
      (id) => lastValue(hourly[id], field)
    );

  return [
    row("temp", "Air Temperature", "device_thermostat", "°C", "airTemp"),
    row("humidity", "Relative Humidity", "humidity_percentage", "%", "humidity"),
    row("pressure", "Barometric Pressure", "speed", "hPa", "pressure"),
    row("rain", "Rain Rate", "rainy", "mm/min", "minAvgRain_mm"),
    row("windSpeed", "Wind Speed", "air", "km/h", "windSpeedKmh"),
    // Circular data — high/low/avg here is a simple arithmetic mean of
    // degrees, which is only meaningful when a station's heading doesn't
    // wrap past 0/360 within the window. A real backend should compute
    // this from the average of the wind's u/v vector components instead.
    row("windDirection", "Wind Direction", "explore", "°", "windDirectionDeg"),
  ];
}

/** Daily High/Low/Avg series for the Past 7/30 Days tabs, from real
 * resolution=day readings (`maxTemp24h`/`minTemp24h` are the station's own
 * daily extremes; `airTemp` at day resolution is that day's average). */
export function buildDailyAggregate(dailyReadings: StationReading[] | undefined) {
  const rows = dailyReadings ?? [];
  return {
    labels: rows.map((r) =>
      new Date(r.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    ),
    avg: rows.map((r) => r.airTemp).filter((v): v is number => v !== null),
    high: rows.map((r) => r.maxTemp24h).filter((v): v is number => v !== null),
    low: rows.map((r) => r.minTemp24h).filter((v): v is number => v !== null),
  };
}

export function formatOfflineDuration(lastSeenAt: string | null) {
  if (!lastSeenAt) return "Unknown duration";
  const hours = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 3600000);
  const mins = Math.floor(((Date.now() - new Date(lastSeenAt).getTime()) % 3600000) / 60000);
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}