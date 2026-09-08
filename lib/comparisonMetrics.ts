import type { StationMockData } from "./mockStationData";

export interface ComparisonMetricConfig {
  key: string;
  label: string;
  unit: string;
  color: string; // hex, used for this metric's line/value color across the UI
  getCurrent: (data: StationMockData) => number;
  getHistory: (data: StationMockData) => number[];
}

/**
 * Every metric the comparison view can plot/tabulate, plus how to pull its
 * current value and history out of a station's mock data. Adding a new
 * comparable metric later is just adding an entry here — ComparisonChart
 * and ComparisonTable both read from this config instead of having their
 * own hardcoded field lists.
 */
export const COMPARISON_METRICS: ComparisonMetricConfig[] = [
  {
    key: "temperature",
    label: "Air Temperature",
    unit: "°C",
    color: "#f59e0b",
    getCurrent: (d) => d.current.airTemp,
    getHistory: (d) => d.tempHistory,
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    color: "#06b6d4",
    getCurrent: (d) => d.current.humidity,
    getHistory: (d) => d.humidityHistory,
  },
  {
    key: "pressure",
    label: "Pressure",
    unit: "hPa",
    color: "#3b82f6",
    getCurrent: (d) => d.current.pressure,
    getHistory: (d) => d.pressureHistory,
  },
  {
    key: "rainfall",
    label: "Rainfall (rolling avg)",
    unit: "mm",
    color: "#6366f1",
    getCurrent: (d) => d.current.rollAvgRain_mm,
    getHistory: (d) => d.rainfallHistory,
  },
];

export interface MetricStats {
  high: number | null;
  low: number | null;
  avg: number | null;
}

/**
 * High/low/average over a set of readings — used by both ComparisonTable
 * (per station, per metric, grouped by station) and StationSummaryTable
 * (per metric, one station). Centralized so both widgets agree on exactly
 * how "average" rounds, rather than each having its own copy.
 */
export function computeMetricStats(values: number[]): MetricStats {
  if (values.length === 0) return { high: null, low: null, avg: null };
  return {
    high: Math.max(...values),
    low: Math.min(...values),
    avg: Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1)),
  };
}