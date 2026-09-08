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

/**
 * Overlay line chart across multiple stations for ONE metric — the
 * "overlay charts across stations" capability FR-2.2 calls for. The
 * dashboard page renders one of these per metric checked in
 * CompareMetricsPanel, so with e.g. Temperature + Humidity both selected,
 * two of these stack vertically.
 *
 * Colors are assigned by position (selection order) from a fixed 4-color
 * palette, matching CompareStationsPanel's station cap — beyond ~4 lines
 * an overlay chart stops being readable regardless of styling.
 */
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