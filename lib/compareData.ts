import type { Station } from "./types";
import { MOCK_STATION_DATA } from "./mockStationData";
import { getLiveTelemetryExtras } from "./liveTelemetryData";
import { getStationHardware } from "./stationHardware";
import { computeMetricStats, type MetricStats } from "./comparisonMetrics";

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

export function buildFindings(stations: Station[]): Finding[] {
  const findings: Finding[] = [];
  const online = stations.filter((s) => s.status === "online");
  const offline = stations.filter((s) => s.status === "offline");

  if (online.length >= 2) {
    const withElev = online
      .map((s) => ({ s, elev: getStationHardware(s.id).elevationM, temp: MOCK_STATION_DATA[s.id]?.current.airTemp ?? 0 }))
      .sort((a, b) => a.elev - b.elev);
    const lowest = withElev[0];
    const highest = withElev[withElev.length - 1];
    const delta = Number((highest.temp - lowest.temp).toFixed(1));
    const elevDelta = highest.elev - lowest.elev;

    if (delta > 0) {
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
    const primary = MOCK_STATION_DATA[online[0].id];
    if (primary) {
      const first = primary.fullDayPressureTrend[0]?.y ?? primary.current.pressure;
      const last = primary.fullDayPressureTrend[primary.fullDayPressureTrend.length - 1]?.y ?? primary.current.pressure;
      const hours = primary.fullDayPressureTrend.length;
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
          ? `Offline ${hoursOffline}h. Dual-pipe synthetic fallback active`
          : "Offline. Dual-pipe synthetic fallback active",
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
  perOfflineStation: Record<string, number>;
}

export function buildMatrixRows(stations: Station[]): MatrixRow[] {
  const online = stations.filter((s) => s.status === "online");
  const offline = stations.filter((s) => s.status === "offline");

  function buildRow(
    key: string,
    label: string,
    icon: string,
    unit: string,
    getSeries: (id: string) => number[],
    getOfflineEstimate: (id: string) => number
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

  return [
    buildRow(
      "temp",
      "Air Temperature",
      "device_thermostat",
      "°C",
      (id) => MOCK_STATION_DATA[id]?.fullDayTrend.map((p) => p.y) ?? [],
      (id) => MOCK_STATION_DATA[id]?.current.airTemp ?? 0
    ),
    buildRow(
      "humidity",
      "Relative Humidity",
      "humidity_percentage",
      "%",
      (id) => MOCK_STATION_DATA[id]?.fullDayHumidityTrend.map((p) => p.y) ?? [],
      (id) => MOCK_STATION_DATA[id]?.current.humidity ?? 0
    ),
    buildRow(
      "pressure",
      "Barometric Pressure",
      "speed",
      "hPa",
      (id) => MOCK_STATION_DATA[id]?.fullDayPressureTrend.map((p) => p.y) ?? [],
      (id) => MOCK_STATION_DATA[id]?.current.pressure ?? 0
    ),
    buildRow(
      "rain",
      "Rain Rate",
      "rainy",
      "mm/h",
      (id) => MOCK_STATION_DATA[id]?.rainAverage ?? [],
      () => 0
    ),
    buildRow(
      "windSpeed",
      "Wind Speed",
      "air",
      "km/h",
      (id) => getLiveTelemetryExtras(id).windSpeedHistory,
      (id) => getLiveTelemetryExtras(id).wind.speedKmh
    ),
    // Circular data — high/low/avg here is a simple arithmetic mean of
    // degrees, which is only meaningful when a station's heading doesn't
    // wrap past 0/360 within the window. A real backend should compute
    // this from the average of the wind's u/v vector components instead.
    buildRow(
      "windDirection",
      "Wind Direction",
      "explore",
      "°",
      (id) => getLiveTelemetryExtras(id).windDirectionHistory,
      (id) => getLiveTelemetryExtras(id).wind.directionDeg
    ),
  ];
}

/** Synthetic daily High/Low/Avg series for the Past 7/30 Days tabs — the
 * mock hourly data only represents "today", so this generates a plausible
 * multi-day picture (deterministic per station via its id's char-code
 * hash) rather than repeating the same day N times. */
export function buildDailyAggregate(stationId: string, days: number) {
  const base = MOCK_STATION_DATA[stationId];
  if (!base) return { labels: [] as string[], avg: [] as number[], high: [] as number[], low: [] as number[] };

  const seed = stationId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const today = new Date();
  const labels: string[] = [];
  const avg: number[] = [];
  const high: number[] = [];
  const low: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
    const wobble = Math.sin(seed + i * 0.7) * 1.8;
    const dayAvg = Number((base.current.airTemp + wobble - i * 0.02).toFixed(1));
    avg.push(dayAvg);
    high.push(Number((dayAvg + 2.2 + Math.abs(Math.sin(seed - i)) * 1.5).toFixed(1)));
    low.push(Number((dayAvg - 3.1 - Math.abs(Math.cos(seed + i)) * 1.2).toFixed(1)));
  }

  return { labels, avg, high, low };
}

export function formatOfflineDuration(lastSeenAt: string | null) {
  if (!lastSeenAt) return "Unknown duration";
  const hours = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 3600000);
  const mins = Math.floor(((Date.now() - new Date(lastSeenAt).getTime()) % 3600000) / 60000);
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}