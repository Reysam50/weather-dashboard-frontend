import { computeSensorBand } from "./sensorBand";
import type { TrendPoint } from "@/components/widgets/TemperatureTrendChart";
import type { DailySummaryRow } from "@/components/widgets/DailySummaryTable";

export interface StationMockData {
  current: {
    airTemp: number;
    humidity: number;
    pressure: number;
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

  return {
    current: {
      airTemp: tempHistory[tempHistory.length - 1],
      humidity: humidityHistory[humidityHistory.length - 1],
      pressure: pressureHistory[pressureHistory.length - 1],
      rollAvgRain_mm: rainfallHistory[rainfallHistory.length - 1],
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