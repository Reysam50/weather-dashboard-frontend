"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface SingleMetricChartProps {
  title: string;
  categories: string[];
  data: number[];
  unit?: string;
  color?: string;
  /** "line" for something like pressure; "area" for an intensity-style
   * reading like solar radiation, where a filled shape reads better. */
  variant?: "line" | "area";
}

/**
 * Plain single-metric chart with full axes/gridlines/tooltip — a simpler
 * building block than TemperatureTrendChart.tsx (which adds a draggable
 * time-range slider) or Sparkline.tsx (which strips axes entirely for use
 * inside BigNumberCard). This is the "just show me one line/area, nothing
 * fancy" widget — matches a standalone Pressure line or Solar Radiation
 * area panel.
 */
export default function SingleMetricChart({
  title,
  categories,
  data,
  unit = "",
  color = "#3b82f6",
  variant = "line",
}: SingleMetricChartProps) {
  const options: ApexOptions = {
    chart: {
      type: variant,
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: false },
    },
    colors: [color],
    stroke: { width: 2, curve: "smooth" },
    // Spreading this in conditionally means the `fill` key simply doesn't
    // exist on the options object for "line" — NOT the same as setting
    // fill: undefined, which was the actual bug here. ApexCharts merges
    // your options with its own defaults; an explicit `undefined` value
    // still "wins" that merge and replaces the default fill object
    // entirely, so anything internal that reads e.g. fill.colors crashes
    // ("can't access property 'colors', a.config[t] is undefined") — and
    // for the "area" case, that same broken merge is why nothing rendered
    // at all. Omitting the key lets ApexCharts fall back to its own
    // sensible default for a plain line.
    ...(variant === "area" && {
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, stops: [0, 90, 100] },
      },
    }),
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: { style: { colors: "#9ca3af" } },
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
      y: { formatter: (val) => `${val}${unit}` },
    },
  };

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">{title}</h2>
      <div className="h-56">
        <ReactApexChart
          options={options}
          series={[{ name: title, data }]}
          type={variant}
          height="100%"
        />
      </div>
    </div>
  );
}