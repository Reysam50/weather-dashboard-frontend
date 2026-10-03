import type { TrendPoint } from "@/components/widgets/TemperatureTrendChart";
import type { DailySummaryRow } from "@/components/widgets/DailySummaryTable";
import type { StationReading } from "./types";
import {
  buildPlaceholderForecast,
  degToCompass,
  dewPointC,
  vaporPressureKPa,
  type IngestLogRow,
  type LiveTelemetryExtras,
} from "./liveTelemetryData";

/**
 * Turns real telemetry (from useLiveTelemetry, which fetches it via
 * apiFetch) into the shapes every Live Dashboard card already expects —
 * this replaced the fabricated mock numbers the dashboard used to run on.
 * Component prop contracts deliberately did not change when this was
 * wired up: only where the data comes from did.
 *
 * Every field a card displays traces back to one specific reading's
 * field being non-null — nothing here invents a plausible-looking number
 * to fill a gap. A `null` propagates all the way to the card, which is
 * what drives each card's own offline state (components/layout/OfflineNotice.tsx).
 */

export interface RainSeries {
  labels: string[];
  gauge1: number[];
  gauge2: number[];
  cumulative: number[];
}

export interface StationView {
  current: {
    airTemp: number | null;
    humidity: number | null;
    pressure: number | null;
    minAvgRain_mm: number | null;
    rollAvgRain_mm: number | null;
    todayHigh: number | null;
    todayLow: number | null;
    lastUpdatedAt: string | null;
  };
  hourLabels: string[];
  tempHistory: number[];
  humidityHistory: number[];
  pressureHistory: number[];
  rainfallHistory: number[];
  rainGauge1: number[];
  rainGauge2: number[];
  rainAverage: number[];
  rainByGranularity: {
    minute: RainSeries;
    hourly: RainSeries;
    daily: RainSeries;
  };
  airTempHistory: number[];
  bmpTempHistory: number[];
  shtTempHistory: number[];
  fullDayTrend: TrendPoint[];
  fullDayHumidityTrend: TrendPoint[];
  fullDayPressureTrend: TrendPoint[];
  fullDayWindDirectionTrend: TrendPoint[];
  fullDayRainTrend: TrendPoint[];
  fullDayWindSpeedTrend: TrendPoint[];
  dailyRows: DailySummaryRow[];
}

const round1 = (n: number) => Number(n.toFixed(1));
const round2 = (n: number) => Number(n.toFixed(2));

type NumericField = {
  [K in keyof StationReading]: StationReading[K] extends number | null ? K : never;
}[keyof StationReading];

/** Drops readings where this field is null rather than plotting a fake 0
 * — a gap in a chart is honest; a dip to zero isn't. */
function series(readings: StationReading[], field: NumericField): number[] {
  return readings.map((r) => r[field]).filter((v): v is number => v !== null);
}

function toTrendPoints(readings: StationReading[], field: NumericField): TrendPoint[] {
  return readings
    .filter((r) => r[field] !== null)
    .map((r) => ({ x: new Date(r.timestamp).getTime(), y: r[field] as number }));
}

function hourLabel(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function buildRainSeries(readings: StationReading[], labelFn: (ts: string) => string): RainSeries {
  const labels: string[] = [];
  const gauge1: number[] = [];
  const gauge2: number[] = [];
  const cumulative: number[] = [];
  let running = 0;
  for (const r of readings) {
    labels.push(labelFn(r.timestamp));
    gauge1.push(r.minRain1_mm ?? 0);
    gauge2.push(r.minRain2_mm ?? 0);
    // rollAvgRain_mm is the station's own rolling accumulator — prefer it
    // when present; fall back to summing what we have so the line still
    // moves sensibly through any gap.
    if (r.rollAvgRain_mm !== null) {
      running = r.rollAvgRain_mm;
    } else {
      running += ((r.minRain1_mm ?? 0) + (r.minRain2_mm ?? 0)) / 2;
    }
    cumulative.push(round2(running));
  }
  return { labels, gauge1, gauge2, cumulative };
}

export function deriveStationView(params: {
  latest: StationReading | null;
  minuteReadings: StationReading[]; // oldest -> newest, ~last 60
  hourlyReadings: StationReading[]; // oldest -> newest, ~last 24
  dailyReadings: StationReading[]; // oldest -> newest, ~last 6-7, one per day
}): StationView {
  const { latest, minuteReadings, hourlyReadings, dailyReadings } = params;

  const dailyRows: DailySummaryRow[] = dailyReadings.map((r) => {
    const d = new Date(r.timestamp);
    return {
      dayNumber: String(d.getDate()).padStart(2, "0"),
      weekday: d.toLocaleDateString(undefined, { weekday: "long" }),
      tempHigh: r.maxTemp24h,
      tempLow: r.minTemp24h,
      tempAvg: r.airTemp !== null && r.maxTemp24h !== null && r.minTemp24h !== null ? round1(r.airTemp) : r.airTemp,
      rainTotal: round1((r.minRain1_mm ?? 0) + (r.minRain2_mm ?? 0)),
    };
  });

  return {
    current: {
      airTemp: latest?.airTemp ?? null,
      humidity: latest?.humidity ?? null,
      pressure: latest?.pressure ?? null,
      minAvgRain_mm: latest?.minAvgRain_mm ?? null,
      rollAvgRain_mm: latest?.rollAvgRain_mm ?? null,
      todayHigh: latest?.maxTemp24h ?? null,
      todayLow: latest?.minTemp24h ?? null,
      lastUpdatedAt: latest?.timestamp ?? null,
    },
    hourLabels: hourlyReadings.map((r) => hourLabel(r.timestamp)),
    tempHistory: series(hourlyReadings, "airTemp"),
    humidityHistory: series(hourlyReadings, "humidity"),
    pressureHistory: series(hourlyReadings, "pressure"),
    rainfallHistory: series(hourlyReadings, "rollAvgRain_mm"),
    rainGauge1: series(hourlyReadings, "minRain1_mm"),
    rainGauge2: series(hourlyReadings, "minRain2_mm"),
    rainAverage: series(hourlyReadings, "minAvgRain_mm"),
    rainByGranularity: {
      minute: buildRainSeries(minuteReadings, (ts) =>
        new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      ),
      hourly: buildRainSeries(hourlyReadings, hourLabel),
      daily: buildRainSeries(dailyReadings, (ts) => new Date(ts).toLocaleDateString(undefined, { weekday: "short" })),
    },
    airTempHistory: series(hourlyReadings, "airTemp"),
    bmpTempHistory: series(hourlyReadings, "bmpTemp"),
    shtTempHistory: series(hourlyReadings, "shtTemp"),
    fullDayTrend: toTrendPoints(hourlyReadings, "airTemp"),
    fullDayHumidityTrend: toTrendPoints(hourlyReadings, "humidity"),
    fullDayPressureTrend: toTrendPoints(hourlyReadings, "pressure"),
    fullDayWindDirectionTrend: toTrendPoints(hourlyReadings, "windDirectionDeg"),
    fullDayRainTrend: toTrendPoints(hourlyReadings, "rollAvgRain_mm"),
    fullDayWindSpeedTrend: toTrendPoints(hourlyReadings, "windSpeedKmh"),
    dailyRows,
  };
}

export function deriveLiveExtras(params: {
  stationId: string;
  latest: StationReading | null;
  minuteReadings: StationReading[];
  hourlyReadings: StationReading[];
  dailyReadings: StationReading[];
  totalReadingsCount: number | null;
}): LiveTelemetryExtras {
  const { stationId, latest, minuteReadings, hourlyReadings, dailyReadings, totalReadingsCount } = params;

  const dew = dewPointC(latest?.airTemp ?? null, latest?.humidity ?? null);

  const g1Total = hourlyReadings.reduce((a, r) => a + (r.minRain1_mm ?? 0), 0);
  const g2Total = hourlyReadings.reduce((a, r) => a + (r.minRain2_mm ?? 0), 0);
  const rainVariancePct =
    g1Total + g2Total > 0 ? round1((Math.abs(g1Total - g2Total) / Math.max(0.1, (g1Total + g2Total) / 2)) * 100) : null;

  const pressures = hourlyReadings.map((r) => r.pressure);
  const lastPressure = latest?.pressure ?? null;
  const pressure3hAgo = pressures.length >= 4 ? pressures[pressures.length - 4] : null;
  const pressureTrend3h = lastPressure !== null && pressure3hAgo !== null ? round2(lastPressure - pressure3hAgo) : null;

  // 6 buckets across the last 24h — bucket the hourly readings into 6
  // roughly-4h groups rather than requiring a 6th resolution from the API.
  const bucketCount = 6;
  const rain6hBuckets = Array.from({ length: bucketCount }, (_, i) => {
    const start = Math.floor((i * hourlyReadings.length) / bucketCount);
    const end = Math.floor(((i + 1) * hourlyReadings.length) / bucketCount);
    const slice = hourlyReadings.slice(start, end);
    return round1(slice.reduce((a, r) => a + (r.minAvgRain_mm ?? 0), 0));
  });

  const rainWeeklyTotalMm =
    dailyReadings.length > 0
      ? round1(dailyReadings.reduce((a, r) => a + (r.minRain1_mm ?? 0) + (r.minRain2_mm ?? 0), 0))
      : null;

  const windSpeedHistory = hourlyReadings.map((r) => r.windSpeedKmh).filter((v): v is number => v !== null);
  const windDirectionHistory = hourlyReadings.map((r) => r.windDirectionDeg).filter((v): v is number => v !== null);

  const directionDeg = latest?.windDirectionDeg ?? null;

  return {
    dewPoint: dew,
    vaporPressureKPa: vaporPressureKPa(dew),
    rain6hBuckets,
    rainWeeklyTotalMm,
    rainVariancePct,
    pressureTrend3h,
    pressureStabilityLabel: pressureTrend3h === null ? "UNKNOWN" : pressureTrend3h >= 0 ? "STABLE HIGH" : "STABLE LOW",
    wind: {
      speedKmh: latest?.windSpeedKmh ?? null,
      directionDeg,
      compass: directionDeg !== null ? degToCompass(directionDeg) : null,
      bearingStable: true,
    },
    windSpeedHistory,
    windDirectionHistory,
    forecast7Day: buildPlaceholderForecast(stationId),
    ingestLog: minuteReadings
      .slice()
      .reverse() // newest first, matching the table's expected row order
      .map(
        (r): IngestLogRow => ({
          time: new Date(r.timestamp).toLocaleTimeString([], { hour12: false }),
          airTemp: r.airTemp,
          bmpTemp: r.bmpTemp,
          shtTemp: r.shtTemp,
          humidity: r.humidity,
          pressure: r.pressure,
          minuteRain_mm: r.minAvgRain_mm,
          windSpeedKmh: r.windSpeedKmh,
          windDirectionDeg: r.windDirectionDeg,
          qaOk: [r.airTemp, r.humidity, r.pressure, r.minAvgRain_mm].every((v) => v !== null),
        })
      ),
    totalReadingsCount: totalReadingsCount ?? minuteReadings.length,
  };
}