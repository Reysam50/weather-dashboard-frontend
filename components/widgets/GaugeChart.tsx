"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface GaugeChartProps {
  title: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  color?: string;
}

/**
 * Circular gauge — FR-6.1 explicitly lists "gauges" alongside charts,
 * tables, and graphs as a required visualization type; nothing in the
 * widget catalog covered this until now. Built on ApexCharts' radialBar
 * chart type, the standard way to render a gauge with this library.
 */
export default function GaugeChart({
  title,
  value,
  min = 0,
  max = 100,
  unit = "",
  color = "#3b82f6",
}: GaugeChartProps) {
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      background: "transparent",
      animations: { enabled: false },
    },
    colors: [color],
    plotOptions: {
      radialBar: {
        hollow: { size: "65%" },
        track: { background: "rgba(255,255,255,0.08)" },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: 8,
            fontSize: "28px",
            fontWeight: 700,
            color: "#ffffff",
            formatter: () => `${value}${unit}`,
          },
        },
      },
    },
    stroke: { lineCap: "round" },
  };

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">{title}</h2>
      <div className="h-48">
        <ReactApexChart
          options={options}
          series={[percent]}
          type="radialBar"
          height="100%"
        />
      </div>
    </div>
  );
}