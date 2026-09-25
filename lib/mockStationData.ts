import { computeSensorBand } from "./sensorBand";
import type { TrendPoint } from "@/components/widgets/TemperatureTrendChart";
import type { DailySummaryRow } from "@/components/widgets/DailySummaryTable";

/**
 * One rain series at a given time resolution — gauge1/gauge2 are the
 * per-bucket amount from each 451A tipping-bucket gauge (matches the real
 * hardware payload's minRain1_mm/minRain2_mm at "minute" resolution, and
 * yestRain1_mm/yestRain2_mm-style daily totals at "daily" resolution —
 * see lib/types.ts's StationReading and
 * 03-hardware-integration/hardware-team-clarification-request.md).
 * `cumulative` is the running rolling total for the window shown (matches
 * rollAvgRain_mm's role: a continuously-accumulating total, not a
 * calendar-hour bucket).
 */
export interface RainSeries {
  labels: string[];
  gauge1: number[];
  gauge2: number[];
  cumulative: number[];
}

export interface StationMockData {
  current: {
    airTemp: number;
    humidity: number;
    pressure: number;
    /** Rain in the current minute, averaged across both gauges — matches
     * the hardware payload's minAvgRain_mm. This is the figure the Live
     * Dashboard leads with (per the minute-level rain requirement), not
     * an hourly rate derived from hourly buckets. */
    minAvgRain_mm: number;
    /** Rolling/cumulative rain total across both gauges — matches the
     * hardware payload's rollAvgRain_mm. This is a continuously-updating
     * accumulator, not a fixed "last 1 hour" window. */
    rollAvgRain_mm: number;
    todayHigh: number;
    todayLow: number;
    lastUpdatedAt: string;
  };
  hourLabels: string[];
  tempHistory: number[];
  humidityHistory: number[];
  pressureHistory: number[];
  rainfallHistory: number[];
  rainGauge1: number[];
  rainGauge2: number[];
  rainAverage: number[];
  /** Rain at minute/hourly/daily resolution, for the Live Dashboard's
   * dual-gauge rainfall card granularity toggle. "minute" is the default
   * view per the minute-rain requirement; "hourly" reuses the same
   * hourLabels/rainGauge1/rainGauge2/rainfallHistory series above so
   * nothing that already reads those breaks. */
  rainByGranularity: {
    minute: RainSeries;
    hourly: RainSeries;
    daily: RainSeries;
  };
  airTempHistory: number[];
  bmpTempHistory: number[];
  shtTempHistory: number[];
  sensorBand: ReturnType<typeof computeSensorBand>;
  fullDayTrend: TrendPoint[];
  /** Full 24h companion series to fullDayTrend, same midnight-anchored
   * timestamps — added because the Compare screen's "Today 24h" charts
   * were actually only plotting humidityHistory/pressureHistory (8
   * points, 06:00-13:00 only) while claiming to show a full day. */
  fullDayHumidityTrend: TrendPoint[];
  fullDayPressureTrend: TrendPoint[];
  dailyRows: DailySummaryRow[];
}

function buildMockStationData(offset: number, minutesAgo: number): StationMockData {
  const hourLabels = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];

  const round1 = (n: number) => Number(n.toFixed(1));
  const round2 = (n: number) => Number(n.toFixed(2));

  const tempHistory = [26.1, 26.4, 26.8, 27.2, 27.9, 28.4, 28.1, 27.6].map((v) => round1(v + offset));
  const humidityHistory = [58, 59, 61, 63, 62, 61.2, 60, 59].map((v) => round1(v - offset * 2));
  const pressureHistory = [1013.8, 1013.5, 1013.1, 1012.9, 1012.7, 1012.5, 1012.4, 1012.5].map((v) =>
    round1(v + offset * 0.5)
  );
  const rainfallHistory = [0, 0, 0.4, 1.2, 2.6, 3.4, 4.0, 4.2].map((v) => round1(Math.max(0, v + offset * 0.3)));

  const rainGauge1 = [0, 0, 0.2, 0.6, 1.0, 0.8, 0.6, 0.4].map((v) => round2(Math.max(0, v + offset * 0.15)));
  const rainGauge2 = [0, 0, 0.3, 0.5, 0.9, 0.9, 0.5, 0.3].map((v) => round2(Math.max(0, v + offset * 0.15)));
  const rainAverage = rainGauge1.map((v, i) => round2((v + rainGauge2[i]) / 2));

  const airTempHistory = tempHistory.map((v) => round1(v - 1.5));
  const bmpTempHistory = tempHistory.map((v) => round1(v - 1.2));
  const shtTempHistory = tempHistory.map((v) => round1(v - 1.7));
  const sensorBand = computeSensorBand([airTempHistory, bmpTempHistory, shtTempHistory]);

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const fullDayCurve = [
    19.2, 18.7, 18.3, 18.0, 17.8, 17.9, 18.6, 20.1, 22.4, 24.6, 26.5, 27.9,
    28.9, 29.4, 29.6, 29.1, 28.2, 26.8, 24.9, 23.1, 21.8, 20.9, 20.1, 19.5,
  ].map((v) => round1(v + offset));
  const fullDayTrend: TrendPoint[] = fullDayCurve.map((y, hour) => ({
    x: todayMidnight.getTime() + hour * 60 * 60 * 1000,
    y,
  }));

  // Roughly inverse of the temperature curve — humid overnight, drier in
  // the afternoon heat, same shape logic used for humidityHistory above
  // just extended across the full day.
  const fullDayHumidityCurve = [
    68, 70, 71, 72, 73, 72, 68, 62, 56, 50, 46, 43,
    41, 40, 41, 43, 47, 52, 58, 62, 65, 67, 68, 68,
  ].map((v) => round1(Math.min(100, Math.max(0, v - offset * 2))));
  const fullDayHumidityTrend: TrendPoint[] = fullDayHumidityCurve.map((y, hour) => ({
    x: todayMidnight.getTime() + hour * 60 * 60 * 1000,
    y,
  }));

  // Gentle semi-diurnal pressure wave (two peaks, two troughs) — same
  // offset scaling as pressureHistory above.
  const fullDayPressureCurve = [
    1012.6, 1012.4, 1012.3, 1012.2, 1012.3, 1012.6, 1013.0, 1013.4,
    1013.7, 1013.8, 1013.7, 1013.4, 1013.0, 1012.6, 1012.3, 1012.1,
    1012.0, 1012.2, 1012.6, 1013.0, 1013.4, 1013.6, 1013.5, 1013.1,
  ].map((v) => round1(v + offset * 0.5));
  const fullDayPressureTrend: TrendPoint[] = fullDayPressureCurve.map((y, hour) => ({
    x: todayMidnight.getTime() + hour * 60 * 60 * 1000,
    y,
  }));

  const dailyRows: DailySummaryRow[] = [
    { dayNumber: "30", weekday: "Sunday", tempHigh: round1(30.1 + offset), tempLow: round1(18.4 + offset), tempAvg: round1(24.2 + offset), rainTotal: round1(Math.max(0, offset * 0.5)) },
    { dayNumber: "31", weekday: "Monday", tempHigh: round1(31.6 + offset), tempLow: round1(19.0 + offset), tempAvg: round1(25.1 + offset), rainTotal: round1(Math.max(0, 2.4 + offset * 0.5)) },
    { dayNumber: "01", weekday: "Tuesday", tempHigh: round1(29.8 + offset), tempLow: round1(18.9 + offset), tempAvg: round1(24.0 + offset), rainTotal: round1(Math.max(0, 6.8 + offset * 0.5)) },
    { dayNumber: "02", weekday: "Wednesday", tempHigh: round1(28.3 + offset), tempLow: round1(17.6 + offset), tempAvg: round1(22.9 + offset), rainTotal: 0 },
    { dayNumber: "03", weekday: "Thursday", tempHigh: round1(30.5 + offset), tempLow: round1(19.4 + offset), tempAvg: round1(24.8 + offset), rainTotal: 0 },
    { dayNumber: "04", weekday: "Friday", tempHigh: round1(31.2 + offset), tempLow: round1(19.8 + offset), tempAvg: round1(25.3 + offset), rainTotal: round1(Math.max(0, 4.2 + offset * 0.5)) },
  ];

  const lastDay = dailyRows[dailyRows.length - 1];
  const rollAvgRain_mm = rainfallHistory[rainfallHistory.length - 1];

  // --- Minute-resolution rain (last 60 minutes) --------------------------
  // Small per-minute tips from each gauge (matches minRain1_mm/minRain2_mm
  // in the real hardware payload), plus a rolling cumulative total that
  // ends at rollAvgRain_mm so the "Cumulative" line on the dual-gauge card
  // agrees with the headline current reading.
  const MINUTE_COUNT = 60;
  const now = new Date();
  const minuteLabels: string[] = [];
  const minuteGauge1: number[] = [];
  const minuteGauge2: number[] = [];
  const minuteCumulative: number[] = [];
  let runningTotal = 0;
  for (let i = MINUTE_COUNT - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60 * 1000);
    minuteLabels.push(t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    const burst = Math.max(0, Math.sin((MINUTE_COUNT - i) / 7 + offset) * 0.18 + offset * 0.01);
    const g1 = round2(Math.max(0, burst + Math.sin(i * 1.7) * 0.03));
    const g2 = round2(Math.max(0, burst * 0.9 + Math.cos(i * 1.3) * 0.03));
    minuteGauge1.push(g1);
    minuteGauge2.push(g2);
    runningTotal += (g1 + g2) / 2;
    minuteCumulative.push(round2(runningTotal));
  }
  // Rescale so the minute series' own cumulative total lands on
  // rollAvgRain_mm exactly, rather than an unrelated number.
  const minuteScale = runningTotal > 0 ? rollAvgRain_mm / runningTotal : 0;
  const minuteGauge1Scaled = minuteGauge1.map((v) => round2(v * minuteScale));
  const minuteGauge2Scaled = minuteGauge2.map((v) => round2(v * minuteScale));
  const minuteCumulativeScaled = minuteCumulative.map((v) => round2(v * minuteScale));
  const minAvgRain_mm = round2((minuteGauge1Scaled[minuteGauge1Scaled.length - 1] + minuteGauge2Scaled[minuteGauge2Scaled.length - 1]) / 2);

  // --- Hourly-resolution rain — reuses the series already built above ----
  const hourlyCumulative = rainGauge1.map((_, i) =>
    round2(rainGauge1.slice(0, i + 1).reduce((a, b) => a + b, 0) + rainGauge2.slice(0, i + 1).reduce((a, b) => a + b, 0))
  );

  // --- Daily-resolution rain — from the 6-day summary rows below ---------
  const dailyLabels = dailyRows.map((d) => d.weekday.slice(0, 3));
  let dailyRunning = 0;
  const dailyGauge1: number[] = [];
  const dailyGauge2: number[] = [];
  const dailyCumulative: number[] = [];
  dailyRows.forEach((d) => {
    const total = d.rainTotal ?? 0;
    dailyGauge1.push(round2(total * 0.52));
    dailyGauge2.push(round2(total * 0.48));
    dailyRunning += total;
    dailyCumulative.push(round1(dailyRunning));
  });

  return {
    current: {
      airTemp: tempHistory[tempHistory.length - 1],
      humidity: humidityHistory[humidityHistory.length - 1],
      pressure: pressureHistory[pressureHistory.length - 1],
      minAvgRain_mm,
      rollAvgRain_mm,
      todayHigh: lastDay.tempHigh ?? 0,
      todayLow: lastDay.tempLow ?? 0,
      lastUpdatedAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
    },
    hourLabels,
    tempHistory,
    humidityHistory,
    pressureHistory,
    rainfallHistory,
    rainGauge1,
    rainGauge2,
    rainAverage,
    rainByGranularity: {
      minute: {
        labels: minuteLabels,
        gauge1: minuteGauge1Scaled,
        gauge2: minuteGauge2Scaled,
        cumulative: minuteCumulativeScaled,
      },
      hourly: {
        labels: hourLabels,
        gauge1: rainGauge1,
        gauge2: rainGauge2,
        cumulative: hourlyCumulative,
      },
      daily: {
        labels: dailyLabels,
        gauge1: dailyGauge1,
        gauge2: dailyGauge2,
        cumulative: dailyCumulative,
      },
    },
    airTempHistory,
    bmpTempHistory,
    shtTempHistory,
    sensorBand,
    fullDayTrend,
    fullDayHumidityTrend,
    fullDayPressureTrend,
    dailyRows,
  };
}

export const MOCK_STATION_DATA: Record<string, StationMockData> = {
  "1": buildMockStationData(0, 3),
  "2": buildMockStationData(1.5, 22),
  "3": buildMockStationData(-1.2, 780),
};