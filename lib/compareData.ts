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

/** Rough bell curve peaking mid-array, anchored so its last point matches
 * the station's current solar reading (extras don't carry a full
 * history, only the latest value) — good enough for a comparison chart,
 * not meant to be a real irradiance model. */
export function buildSolarSeries(currentWm2: number, length: number): number[] {
  return Array.from({ length }, (_, i) => {
    const t = i / Math.max(1, length - 1);
    const bell = Math.sin(Math.PI * t) ** 1.3;
    return Math.round(currentWm2 * (0.15 + 0.85 * bell));
  });
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
      const first = primary.pressureHistory[0];
      const last = primary.pressureHistory[primary.pressureHistory.length - 1];
      const hours = primary.hourLabels.length;
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
  delta: { text: string; tag: string; positive: boolean } | null;
}

const RAIN_TAG = (v: number) => (v > 0 ? "[Orographic]" : "[Uniform]");
const SOLAR_TAG = (v: number) => (v > 0 ? "[High-Alt Flux]" : "[Attenuated]");

export function buildMatrixRows(stations: Station[]): MatrixRow[] {
  const online = stations.filter((s) => s.status === "online");
  const offline = stations.filter((s) => s.status === "offline");

  function buildRow(
    key: string,
    label: string,
    icon: string,
    unit: string,
    getSeries: (id: string) => number[],
    getOfflineEstimate: (id: string) => number,
    tag: (delta: number, aName: string, bName: string) => { text: string; tag: string }
  ): MatrixRow {
    const perOnlineStation: MatrixRow["perOnlineStation"] = {};
    online.forEach((s) => {
      perOnlineStation[s.id] = computeMetricStats(getSeries(s.id));
    });
    const perOfflineStation: MatrixRow["perOfflineStation"] = {};
    offline.forEach((s) => {
      perOfflineStation[s.id] = getOfflineEstimate(s.id);
    });

    let delta: MatrixRow["delta"] = null;
    if (online.length >= 2) {
      const sorted = [...online].sort(
        (a, b) => (perOnlineStation[b.id].avg ?? 0) - (perOnlineStation[a.id].avg ?? 0)
      );
      const top = sorted[0];
      const second = sorted[1];
      const diff = Number(((perOnlineStation[top.id].avg ?? 0) - (perOnlineStation[second.id].avg ?? 0)).toFixed(1));
      const { text, tag: tagText } = tag(diff, top.name, second.name);
      delta = { text, tag: tagText, positive: diff >= 0 };
    }

    return { key, label, icon, unit, perOnlineStation, perOfflineStation, delta };
  }

  return [
    buildRow(
      "temp",
      "Air Temperature",
      "device_thermostat",
      "°C",
      (id) => MOCK_STATION_DATA[id]?.tempHistory ?? [],
      (id) => MOCK_STATION_DATA[id]?.current.airTemp ?? 0,
      (diff) => ({ text: `+${diff}°C`, tag: diff > 0.5 ? "[Inversion]" : "[Gradient]" })
    ),
    buildRow(
      "humidity",
      "Relative Humidity",
      "humidity_percentage",
      "%",
      (id) => MOCK_STATION_DATA[id]?.humidityHistory ?? [],
      (id) => MOCK_STATION_DATA[id]?.current.humidity ?? 0,
      (diff) => ({ text: `${diff}%`, tag: diff < 0 ? "[Plateau Lag]" : "[Valley Trap]" })
    ),
    buildRow(
      "pressure",
      "Barometric Pressure",
      "speed",
      "hPa",
      (id) => MOCK_STATION_DATA[id]?.pressureHistory ?? [],
      (id) => MOCK_STATION_DATA[id]?.current.pressure ?? 0,
      (diff) => ({ text: `${diff >= 0 ? "+" : ""}${diff} hPa`, tag: "[Gradient]" })
    ),
    buildRow(
      "rain",
      "Rain Rate",
      "rainy",
      "mm/h",
      (id) => MOCK_STATION_DATA[id]?.rainAverage ?? [],
      () => 0,
      (diff) => ({ text: `${diff >= 0 ? "+" : ""}${diff} mm`, tag: RAIN_TAG(diff) })
    ),
    buildRow(
      "solar",
      "Solar Radiation",
      "wb_sunny",
      "W/m²",
      (id) => {
        const base = MOCK_STATION_DATA[id];
        const extras = getLiveTelemetryExtras(id);
        return base ? buildSolarSeries(extras.solarWm2, base.hourLabels.length) : [];
      },
      (id) => Math.round(getLiveTelemetryExtras(id).solarWm2 * 0.55),
      (diff) => ({ text: `${diff >= 0 ? "+" : ""}${diff} W`, tag: SOLAR_TAG(diff) })
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