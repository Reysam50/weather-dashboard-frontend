"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

// Same reason as Sparkline.tsx: ApexCharts needs `window`, which doesn't
// exist during server-side render, so it has to load client-only.
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface RainfallComparisonChartProps {
  /** X-axis labels, e.g. hour marks: ["06:00", "07:00", ...] */
  categories: string[];
  gauge1: number[];
  gauge2: number[];
  average: number[];
}

/**
 * Full (non-sparkline) multi-series chart comparing the two independent
 * rain gauges against their averaged reading — per
 * dashboard-reference-analysis.md's "multi-series chart with live legends"
 * widget type. The two gauges exist for redundancy, so this chart is also a
 * diagnostic: if one gauge's bars consistently drift from the other, that's
 * a sign it needs checking or cleaning.
 *
 * Unlike Sparkline.tsx, this one keeps its axes, gridlines, tooltip, and
 * legend — it's meant to be read carefully, not glanced at.
 */
export default function RainfallComparisonChart({
  categories,
  gauge1,
  gauge2,
  average,
}: RainfallComparisonChartProps) {
  const options: ApexOptions = {
    chart: {
      // Mixing bar + line series (below) requires the chart's base type to
      // be "line" — each series then declares its own type individually.
      type: "line",
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: false },
    },
    plotOptions: {
      bar: { columnWidth: "55%", borderRadius: 3 },
    },
    colors: ["#6366f1", "#818cf8", "#f59e0b"], // gauge 1, gauge 2, average
    dataLabels: { enabled: false },
    stroke: { width: [0, 0, 2] }, // no line stroke on the two bar series
    xaxis: {
      categories,
      labels: { style: { colors: "#9ca3af" } },
      axisBorder: { color: "rgba(255,255,255,0.1)" },
      axisTicks: { color: "rgba(255,255,255,0.1)" },
    },
    yaxis: {
      labels: {
        style: { colors: "#9ca3af" },
        formatter: (val) => `${val}mm`,
      },
    },
    grid: { borderColor: "rgba(255,255,255,0.06)" },
    legend: {
      position: "top",
      horizontalAlign: "left",
      labels: { colors: "#d1d5db" },
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (val) => `${val} mm` },
    },
  };

  const series = [
    { name: "Gauge 1", type: "column", data: gauge1 },
    { name: "Gauge 2", type: "column", data: gauge2 },
    { name: "Average", type: "line", data: average },
  ];

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">
        Rainfall — Gauge Comparison
      </h2>
      <div className="h-64">
        <ReactApexChart
          options={options}
          series={series}
          type="line"
          height="100%"
        />
      </div>
    </div>
  );
}