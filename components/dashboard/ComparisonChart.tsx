"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { Station } from "@/lib/types";
import type { ComparisonMetricConfig } from "@/lib/comparisonMetrics";
import { MOCK_STATION_DATA } from "@/lib/mockStationData";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const STATION_LINE_COLORS = ["#f59e0b", "#06b6d4", "#a78bfa", "#22c55e"];

interface ComparisonChartProps {
  metric: ComparisonMetricConfig;
  stations: Station[];
}

export default function ComparisonChart({ metric, stations }: ComparisonChartProps) {
  if (stations.length === 0) return null;

  const hourLabels = MOCK_STATION_DATA[stations[0].id]?.hourLabels ?? [];

  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: false },
    },
    colors: STATION_LINE_COLORS,
    stroke: { width: 2, curve: "smooth" },
    dataLabels: { enabled: false },
    xaxis: {
      categories: hourLabels,
      labels: { style: { colors: "#9ca3af" } },
      axisBorder: { color: "rgba(255,255,255,0.1)" },
      axisTicks: { color: "rgba(255,255,255,0.1)" },
    },
    yaxis: {
      labels: {
        style: { colors: "#9ca3af" },
        formatter: (val) => `${val}${metric.unit}`,
      },
    },
    grid: { borderColor: "rgba(255,255,255,0.06)" },
    legend: {
      position: "top",
      horizontalAlign: "left",
      labels: { colors: "#d1d5db" },
      formatter: (seriesName: string, opts) => {
        const seriesData: number[] = opts.w.globals.series[opts.seriesIndex] ?? [];
        if (seriesData.length === 0) return seriesName;
        const avg = seriesData.reduce((sum, v) => sum + v, 0) / seriesData.length;
        return `${seriesName}: ${avg.toFixed(1)}${metric.unit} avg`;
      },
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (val) => `${val}${metric.unit}` },
    },
  };

  const series = stations.map((station) => {
    const stationData = MOCK_STATION_DATA[station.id];
    return {
      name: station.name,
      data: stationData ? metric.getHistory(stationData) : [],
    };
  });

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">
        {metric.label} — Station Comparison
      </h2>
      <div className="h-72">
        <ReactApexChart options={options} series={series} type="line" height="100%" />
      </div>
    </div>
  );
}