export type WidgetCategory = "big-number" | "chart" | "table";

export interface WidgetCatalogEntry {
  id: string;
  name: string;
  category: WidgetCategory;
  description: string;
  requiresSensors?: string[];
  defaultEnabled: boolean;
}

export const STATION_SENSOR_CAPABILITIES = [
  "airTemp",
  "bmpTemp",
  "shtTemp",
  "pressure",
  "humidity",
  "minRain1_mm",
  "minRain2_mm",
  "minAvgRain_mm",
  "rollAvgRain_mm",
];

export function isWidgetAvailable(entry: WidgetCatalogEntry): boolean {
  if (!entry.requiresSensors) return true;
  return entry.requiresSensors.every((sensor) =>
    STATION_SENSOR_CAPABILITIES.includes(sensor)
  );
}

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  {
    id: "temperature-card",
    name: "Air Temperature",
    category: "big-number",
    description: "Current air temperature with trend sparkline and today's high/low.",
    defaultEnabled: true,
  },
  {
    id: "humidity-card",
    name: "Humidity",
    category: "big-number",
    description: "Current humidity with trend sparkline.",
    defaultEnabled: true,
  },
  {
    id: "pressure-card",
    name: "Pressure",
    category: "big-number",
    description: "Current pressure with trend sparkline.",
    defaultEnabled: true,
  },
  {
    id: "rainfall-card",
    name: "Rainfall (rolling avg)",
    category: "big-number",
    description: "Current rolling-average rainfall with trend sparkline.",
    defaultEnabled: true,
  },
  {
    id: "rain-comparison-chart",
    name: "Dual Gauge Comparison",
    category: "chart",
    description: "Bar comparison of both rain gauges plus their averaged line — a QA/diagnostic chart.",
    requiresSensors: ["minRain1_mm", "minRain2_mm"],
    defaultEnabled: true,
  },
  {
    id: "sensor-band-chart",
    name: "Sensor Agreement Band",
    category: "chart",
    description: "Shaded min–max band across the three temperature sensors with an average line — a sensor QA/diagnostic chart, not a value-threshold range chart (see 'Temperature Threshold Bands' for that).",
    requiresSensors: ["airTemp", "bmpTemp", "shtTemp"],
    defaultEnabled: true,
  },
  {
    id: "temperature-gauge",
    name: "Temperature Gauge",
    category: "chart",
    description: "Circular gauge showing current temperature against a fixed range.",
    defaultEnabled: false,
  },
  {
    id: "humidity-gauge",
    name: "Humidity Gauge",
    category: "chart",
    description: "Circular gauge showing current humidity (0–100%).",
    defaultEnabled: false,
  },
  {
    id: "sensor-pie-chart",
    name: "Sensor Readings — Pie",
    category: "chart",
    description: "Pie chart with live values/percentages and a Total row across the three temperature sensors.",
    requiresSensors: ["airTemp", "bmpTemp", "shtTemp"],
    defaultEnabled: false,
  },
  {
    id: "sensor-bar-chart",
    name: "Sensor Readings — Bar",
    category: "chart",
    description: "Bar chart matched pair to 'Sensor Readings — Pie': same series, same live-value/Total legend.",
    requiresSensors: ["airTemp", "bmpTemp", "shtTemp"],
    defaultEnabled: false,
  },
  {
    id: "temperature-threshold-bands",
    name: "Temperature Threshold Bands",
    category: "chart",
    description: "Line chart with the y-axis colored into value-threshold bands (cold/mild/hot) and a band legend.",
    defaultEnabled: false,
  },
  {
    id: "trend-chart",
    name: "Full-Day Trend (with time slider)",
    category: "chart",
    description: "Detailed temperature line chart with a draggable overview strip to zoom into a time range.",
    defaultEnabled: true,
  },
  {
    id: "daily-summary-table",
    name: "Daily Summary Table",
    category: "table",
    description: "One row per day: high, low, average, and rainfall total.",
    defaultEnabled: true,
  },
  {
    id: "station-summary-table",
    name: "Period Summary Table",
    category: "table",
    description: "High/low/average across several metrics over a labeled period.",
    defaultEnabled: false,
  },
  {
    id: "raw-readings-table",
    name: "Raw Readings Table",
    category: "table",
    description: "Scrollable table of individual readings over time.",
    defaultEnabled: false,
  },
  {
    id: "multi-sensor-line-chart",
    name: "Temperature Sensors — Individual Lines",
    category: "chart",
    description: "The three raw temperature sensors plotted as separate lines instead of a collapsed band.",
    requiresSensors: ["airTemp", "bmpTemp", "shtTemp"],
    defaultEnabled: false,
  },
  {
    id: "pressure-line-chart",
    name: "Pressure — Line",
    category: "chart",
    description: "Plain single-line pressure chart, no time-range slider.",
    defaultEnabled: false,
  },
  {
    id: "rainfall-area-chart",
    name: "Rainfall — Area",
    category: "chart",
    description: "Rainfall plotted as a filled area rather than a line.",
    defaultEnabled: false,
  },
  {
    id: "wind-direction-scatter",
    name: "Wind Direction (Compass)",
    category: "chart",
    description: "Scatter of a 0–360° directional reading against time, labeled N/E/S/W.",
    requiresSensors: ["windDirection"],
    defaultEnabled: false,
  },
  {
    id: "rain-accumulation-rate-chart",
    name: "Rainfall — Rate vs. Cumulative",
    category: "chart",
    description: "Bars for per-hour rate plus a line for the running total so far.",
    requiresSensors: ["minRain1_mm", "rollAvgRain_mm"],
    defaultEnabled: false,
  },
];

export const DEFAULT_ENABLED_WIDGET_IDS = WIDGET_CATALOG.filter(
  (w) => w.defaultEnabled
).map((w) => w.id);