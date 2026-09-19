import { MOCK_STATION_DATA, type StationMockData } from "./mockStationData";

const round1 = (n: number) => Number(n.toFixed(1));
const round2 = (n: number) => Number(n.toFixed(2));

/** Simple Magnus-formula dew point / vapor pressure — good enough for a
 * mock display card, not meant to be meteorologically precise. */
function dewPointC(tempC: number, relHumidityPct: number) {
  const a = 17.27;
  const b = 237.3;
  const alpha = (a * tempC) / (b + tempC) + Math.log(relHumidityPct / 100);
  return round1((b * alpha) / (a - alpha));
}

function vaporPressureKPa(dewC: number) {
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
 * sensorAgreementToleranceC, via AdminSettingsContext) — deliberately NOT
 * baked into LIVE_TELEMETRY_EXTRAS below, since that's built once at
 * module load and can't react to a tolerance the user changes at
 * runtime. Call this directly from the component with the live values
 * and the live tolerance instead.
 */
export function computeSensorAgreement(
  airTempC: number,
  bmpTempC: number,
  shtTempC: number,
  toleranceC: number
): SensorAgreement {
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
  airTemp: number;
  bmpTemp: number;
  shtTemp: number;
  humidity: number;
  pressure: number;
  rainRate: number;
  solar: number;
  qaScore: number;
}

export interface LiveTelemetryExtras {
  dewPoint: number;
  vaporPressureKPa: number;
  rain6hBuckets: number[]; // 6 buckets across the last 24h
  rainWeeklyTotalMm: number;
  rainVariancePct: number;
  pressureTrend3h: number;
  pressureStabilityLabel: string;
  solarWm2: number;
  uvIndex: number;
  uvCategory: string;
  solarNoonPeakWm2: number;
  wind: {
    speedKmh: number;
    gustKmh: number;
    gustSpreadKmh: number;
    directionDeg: number;
    compass: string;
    bearingStable: boolean;
  };
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

function buildForecast(offset: number, seed: number): ForecastDay[] {
  const today = new Date();
  const rainPattern = [0, 0, 12, 18, 0.2, 0, 1.4];

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const label =
      i === 0
        ? "TOD"
        : date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3).toUpperCase();
    const wobble = Math.sin(seed + i) * 1.5;
    const { icon, color } = FORECAST_ICONS[(i + seed) % FORECAST_ICONS.length];

    return {
      label,
      icon,
      iconColor: color,
      high: round1(31 + offset - i * 0.6 + wobble),
      low: round1(20 + offset - i * 0.4 + wobble * 0.5),
      rainMm: round1(Math.max(0, rainPattern[i] * (1 + offset * 0.1))),
    };
  });
}

function buildIngestLog(base: StationMockData, count: number): IngestLogRow[] {
  const anchor = new Date(base.current.lastUpdatedAt);
  const { airTemp, humidity, pressure, rollAvgRain_mm } = base.current;
  const bmpNow = base.bmpTempHistory[base.bmpTempHistory.length - 1];
  const shtNow = base.shtTempHistory[base.shtTempHistory.length - 1];

  return Array.from({ length: count }, (_, i) => {
    const t = new Date(anchor.getTime() - i * 60 * 1000);
    const drift = Math.sin(i / 9) * 0.15 + i * 0.006;
    return {
      time: t.toLocaleTimeString([], { hour12: false }),
      airTemp: round2(airTemp - drift),
      bmpTemp: round2(bmpNow - drift * 0.9),
      shtTemp: round2(shtNow - drift * 1.1),
      humidity: round1(humidity + drift * 1.5),
      pressure: round2(pressure - drift * 0.3),
      rainRate: round2(Math.max(0, rollAvgRain_mm / 2.4 - i * 0.01)),
      solar: round1(Math.max(0, 690 - i * 2.8)),
      qaScore: round2(0.97 + (Math.abs(Math.sin(i)) % 0.03)),
    };
  });
}

function buildLiveExtras(stationId: string, offset: number, seed: number): LiveTelemetryExtras {
  const base = MOCK_STATION_DATA[stationId];
  const airExt = base.current.airTemp;

  const dew = dewPointC(airExt, base.current.humidity);

  const g1Total = round1(base.rainGauge1.reduce((a, b) => a + b, 0));
  const g2Total = round1(base.rainGauge2.reduce((a, b) => a + b, 0));
  const rainVariancePct = round1(
    (Math.abs(g1Total - g2Total) / Math.max(0.1, (g1Total + g2Total) / 2)) * 100
  );

  const last = base.pressureHistory.length - 1;
  const pressureTrend3h = round2(
    base.pressureHistory[last] - base.pressureHistory[Math.max(0, last - 3)]
  );

  const windSpeed = round1(5 + offset + Math.sin(seed) * 1.2);
  const windGust = round1(windSpeed * 2.85);
  const directionDeg = Math.round((90 + offset * 40 + seed * 25) % 360);

  const solarWm2 = round1(Math.max(0, 680 + offset * 10 + Math.sin(seed) * 20));
  const uvIndex = Math.min(11, Math.max(0, Math.round(solarWm2 / 110)));

  return {
    dewPoint: dew,
    vaporPressureKPa: vaporPressureKPa(dew),
    rain6hBuckets: [0.2, 0.6, 2.1, 1.3, 0.1, 0].map((v) => round1(Math.max(0, v + offset * 0.2))),
    rainWeeklyTotalMm: round1(base.current.rollAvgRain_mm * 4.4 + offset),
    rainVariancePct,
    pressureTrend3h,
    pressureStabilityLabel: pressureTrend3h >= 0 ? "STABLE HIGH" : "STABLE LOW",
    solarWm2,
    uvIndex,
    uvCategory: uvIndex >= 8 ? "HIGH" : uvIndex >= 6 ? "MOD" : uvIndex >= 3 ? "LOW" : "MIN",
    solarNoonPeakWm2: round1(solarWm2 + 10),
    wind: {
      speedKmh: windSpeed,
      gustKmh: windGust,
      gustSpreadKmh: round1(windGust - windSpeed),
      directionDeg,
      compass: degToCompass(directionDeg),
      bearingStable: true,
    },
    forecast7Day: buildForecast(offset, seed),
    ingestLog: buildIngestLog(base, 60),
    // Representative of a full 24h @ 60s-interval stream (FR-7.2); we only
    // materialize the last 60 minutes above for the demo table.
    totalReadingsCount: 1440,
  };
}

export const LIVE_TELEMETRY_EXTRAS: Record<string, LiveTelemetryExtras> = {
  "1": buildLiveExtras("1", 0, 1),
  "2": buildLiveExtras("2", 1.5, 2),
  "3": buildLiveExtras("3", -1.2, 3),
};

export function getLiveTelemetryExtras(stationId: string): LiveTelemetryExtras {
  return LIVE_TELEMETRY_EXTRAS[stationId] ?? LIVE_TELEMETRY_EXTRAS["1"];
}