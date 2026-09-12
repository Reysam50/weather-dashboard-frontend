"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface AccumulationRateChartProps {
  title?: string;
  categories: string[];
  /** Amount added per interval, e.g. rainfall in the last hour. */
  rate: number[];
  /** Running total over the same window. */
  cumulative: number[];
  unit?: string;
  rateColor?: string;
  cumulativeColor?: string;
}

/**
 * Rate (bars) + running total (line) for a single accumulating metric on
 * ONE station — e.g. rainfall per hour vs. the total so far today.
 *
 * Different from RainfallComparisonChart.tsx, which compares the SAME
 * rate metric across two physical gauges on one station (a QA/diagnostic
 * chart); this instead shows one gauge's rate against its own cumulative
 * total (a "how much so far" chart).
 */
export default function AccumulationRateChart({
  title = "Accumulation",
  categories,
  rate,
  cumulative,
  unit = "mm",
  rateColor = "#6366f1",
  cumulativeColor = "#f59e0b",
}: AccumulationRateChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: false },
    },
    colors: [rateColor, cumulativeColor],
    stroke: { width: [0, 2], curve: "smooth" },
    plotOptions: { bar: { columnWidth: "55%", borderRadius: 3 } },
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
    { name: "Rate", type: "column", data: rate },
    { name: "Cumulative", type: "line", data: cumulative },
  ];

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">{title}</h2>
      <div className="h-64">
        <ReactApexChart options={options} series={series} type="line" height="100%" />
      </div>
    </div>
  );
}