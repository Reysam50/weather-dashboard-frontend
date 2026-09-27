"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export interface TrendPoint {
  x: number; // unix ms timestamp
  y: number;
}

interface TemperatureTrendChartProps {
  title: string;
  data: TrendPoint[];
  color?: string;
  unit?: string;
}

/**
 * Full-day line chart with a time-range slider underneath — the "line chart
 * with time-range slider" widget type from dashboard-reference-analysis.md §2.
 * ApexCharts calls this pattern a "brush chart": two separate chart
 * instances linked by chart.id / chart.brush.target — the top one is the
 * detailed, zoomable view; the small one underneath always shows the full
 * range with a draggable selection box you use to pick what the top chart
 * zooms into.
 *
 * Needs a real timestamp (unix ms) per point rather than category labels —
 * ApexCharts' brush/selection math is timestamp-based, not label-based.
 */
export default function TemperatureTrendChart({
  title,
  data,
  color = "#f59e0b",
  unit = "",
}: TemperatureTrendChartProps) {
  const mainOptions: ApexOptions = {
    chart: {
      id: "trend-main",
      type: "line",
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: false },
    },
    colors: [color],
    stroke: { width: 2, curve: "smooth" },
    dataLabels: { enabled: false },
    xaxis: {
      type: "datetime",
      labels: { style: { colors: "#9ca3af" }, datetimeUTC: false },
      axisBorder: { color: "rgba(255,255,255,0.1)" },
      axisTicks: { color: "rgba(255,255,255,0.1)" },
    },
    yaxis: {
      labels: {
        style: { colors: "#9ca3af" },
        formatter: (val) => `${val}${unit}`,
      },
    },
    grid: { borderColor: "rgba(255,255,255,0.06)" },
    tooltip: {
      theme: "dark",
      x: { format: "HH:mm" },
      y: { formatter: (val) => `${val}${unit}` },
    },
  };

  // Default selection window: the most recent quarter of the day's data.
  const selectionStart = data[Math.floor(data.length * 0.75)]?.x ?? data[0]?.x;
  const selectionEnd = data[data.length - 1]?.x ?? data[0]?.x;

  const brushOptions: ApexOptions = {
    chart: {
      id: "trend-brush",
      type: "area",
      brush: { target: "trend-main", enabled: true },
      selection: {
        enabled: true,
        xaxis: { min: selectionStart, max: selectionEnd },
        // Without explicit fill/stroke colors, ApexCharts' default
        // selection box is nearly invisible on a dark background — it can
        // read as a stray line instead of an obvious draggable control.
        fill: { color: "#3b82f6", opacity: 0.15 },
        stroke: { width: 1, color: "#3b82f6", opacity: 0.6 },
      },
      toolbar: { show: false },
      background: "transparent",
    },
    colors: [color],
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0 },
    },
    stroke: { width: 1, curve: "smooth" },
    xaxis: {
      type: "datetime",
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { show: false } },
    grid: { show: false },
  };

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">{title}</h2>

      <div className="h-64">
        <ReactApexChart
          options={mainOptions}
          series={[{ name: title, data }]}
          type="line"
          height="100%"
        />
      </div>

      {/* The draggable overview strip — drag the shaded box below to
          change what the chart above zooms into. The border-t + caption
          make it clear this is a separate control, not a second line
          tacked onto the chart above it. */}
      <div className="border-t border-white/10 mt-3 pt-2">
        <p className="text-[10px] text-gray-500 mb-1">
          Drag to select a time range
        </p>
        <div className="h-20">
          <ReactApexChart
            options={brushOptions}
            series={[{ name: title, data }]}
            type="area"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}