"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface DirectionScatterChartProps {
  title?: string;
  categories: string[];
  /** Compass degrees, 0–360, one per category. */
  degrees: number[];
  color?: string;
}

/**
 * Compass-style scatter: plots a 0–360° directional reading against time,
 * with N/E/S/W labels on the y-axis instead of plain numbers.
 *
 * No current sensor produces this — your hardware has no wind vane — but
 * it's a genuinely distinct chart shape worth having in the widget catalog
 * now: per the ThingsBoard-style admin panel plan, widgets exist
 * independent of which stations currently have the sensor for them. If a
 * wind sensor (or any other circular/directional metric) gets added to a
 * station later, this widget is ready to wire up without inventing a new
 * chart type at that point.
 */
export default function DirectionScatterChart({
  title = "Direction",
  categories,
  degrees,
  color = "#3b82f6",
}: DirectionScatterChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "scatter",
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: false },
    },
    colors: [color],
    xaxis: {
      categories,
      labels: { style: { colors: "#9ca3af" } },
      axisBorder: { color: "rgba(255,255,255,0.1)" },
      axisTicks: { color: "rgba(255,255,255,0.1)" },
    },
    yaxis: {
      min: 0,
      max: 360,
      tickAmount: 4,
      labels: {
        style: { colors: "#9ca3af" },
        formatter: (val) => {
          const compass = ["N", "E", "S", "W", "N"];
          return compass[Math.round(val / 90)] ?? `${Math.round(val)}°`;
        },
      },
    },
    grid: { borderColor: "rgba(255,255,255,0.06)" },
    tooltip: {
      theme: "dark",
      y: { formatter: (val) => `${val}°` },
    },
  };

  const series = [
    {
      name: title,
      data: degrees.map((d, i) => ({ x: categories[i], y: d })),
    },
  ];

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">{title}</h2>
      <div className="h-56">
        <ReactApexChart options={options} series={series} type="scatter" height="100%" />
      </div>
    </div>
  );
}