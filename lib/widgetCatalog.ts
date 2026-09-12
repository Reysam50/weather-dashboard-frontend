export type WidgetCategory = "big-number" | "chart" | "table";

export interface WidgetCatalogEntry {
  id: string; // matches the widget id used in the dashboard's widgetContent map
  name: string;
  category: WidgetCategory;
  description: string;
  /** Telemetry fields this widget needs to be meaningful. If a station's
   * capabilities don't include all of these, the admin picker disables it
   * rather than letting it be enabled empty. */
  requiresSensors?: string[];
  /** Ships enabled on every station by default — the original "core"
   * widget set from before per-station configuration existed. Everything
   * added after that (the demo batch) defaults to off, so an admin
   * explicitly opts a station into them instead of every station suddenly
   * growing 7 new widgets. */
  defaultEnabled: boolean;
}

/**
 * Every telemetry field currently produced by the hardware, per
 * 03-hardware-integration/hardware-team-clarification-request.md. Used to
 * decide which catalog widgets a station can actually support.
 *
 * All mock stations share this same capability set today because all
 * hardware is identical — this becomes genuinely per-station once
 * stations can have different equipment/device profiles (e.g. if a wind
 * sensor gets added to only some stations later).
 */
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

/**
 * Every widget instance that can appear on a station's dashboard — the ids
 * here match exactly what app/(protected)/dashboard/page.tsx's
 * widgetContent map uses, so this catalog is directly wireable rather than
 * just documentation (which is what it was before the admin per-station
 * picker existed).
 */
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
    description: "Shaded min–max band across the three temperature sensors with an average line.",
    requiresSensors: ["airTemp", "bmpTemp", "shtTemp"],
    defaultEnabled: true,
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
    requiresSensors: ["windDirection"], // not produced by any current hardware
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