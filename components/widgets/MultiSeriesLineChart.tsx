"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface Series {
  name: string;
  data: number[];
  color?: string;
}

interface MultiSeriesLineChartProps {
  title: string;
  categories: string[];
  series: Series[];
  unit?: string;
}

const DEFAULT_COLORS = ["#f59e0b", "#06b6d4", "#3b82f6", "#a78bfa"];

/**
 * Generic overlay of several DIFFERENT metrics for ONE station — e.g. Air
 * Temperature vs. Dew Point, or the three raw temperature sensors plotted
 * as individual lines instead of collapsed into SensorBandChart's
 * min/max band.
 *
 * This is the mirror image of ComparisonChart.tsx: that one overlays the
 * SAME metric across MULTIPLE stations; this overlays MULTIPLE metrics
 * for ONE station.
 */
export default function MultiSeriesLineChart({
  title,
  categories,
  series,
  unit = "",
}: MultiSeriesLineChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: false },
    },
    colors: series.map((s, i) => s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]),
    stroke: { width: 2, curve: "smooth" },
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
    legend: {
      position: "top",
      horizontalAlign: "left",
      labels: { colors: "#d1d5db" },
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (val) => `${val}${unit}` },
    },
  };

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">{title}</h2>
      <div className="h-64">
        <ReactApexChart options={options} series={series} type="line" height="100%" />
      </div>
    </div>
  );
}