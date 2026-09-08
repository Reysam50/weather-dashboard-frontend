"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

// Same reason as the other chart widgets: ApexCharts needs `window`, which
// doesn't exist during server-side render.
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface SensorBandChartProps {
  title: string;
  categories: string[];
  min: number[];
  max: number[];
  average: number[];
  unit?: string;
}

/**
 * Banded range chart: a shaded min–max envelope with an average line drawn
 * through it — per dashboard-reference-analysis.md's "banded range chart"
 * widget type. Built for comparing the three redundant temperature sensors
 * (airTemp/bmpTemp/shtTemp via lib/sensorBand.ts), but works for any metric
 * with multiple readings you want to keep in visual agreement — a station
 * with only one sensor for a given metric doesn't need this chart at all.
 *
 * chart.type is "rangeArea" (the shaded band); the average line is added
 * as a second series with its own type: "line" — ApexCharts lets you mix
 * series types like this as long as the base chart.type is "rangeArea".
 */
export default function SensorBandChart({
  title,
  categories,
  min,
  max,
  average,
  unit = "",
}: SensorBandChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "rangeArea",
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: false },
    },
    colors: ["#3b82f6", "#f59e0b"], // band fill, average line
    fill: { opacity: [0.2, 1] }, // band mostly transparent, line solid
    stroke: { width: [0, 3], curve: "smooth" },
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

  const series = [
    {
      name: "Sensor Range",
      type: "rangeArea",
      data: categories.map((c, i) => ({ x: c, y: [min[i], max[i]] })),
    },
    {
      name: "Average",
      type: "line",
      data: categories.map((c, i) => ({ x: c, y: average[i] })),
    },
  ];

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">{title}</h2>
      <div className="h-64">
        <ReactApexChart
          options={options}
          series={series}
          type="rangeArea"
          height="100%"
        />
      </div>
    </div>
  );
}