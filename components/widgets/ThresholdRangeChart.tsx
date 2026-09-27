"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export interface ThresholdBand {
  label: string;
  from: number;
  to: number;
  color: string;
}

interface ThresholdRangeChartProps {
  title: string;
  categories: string[];
  data: number[];
  bands: ThresholdBand[];
  unit?: string;
  lineColor?: string;
}

/**
 * Color-banded THRESHOLD range chart — dashboard-reference-analysis.md §2
 * Row 3's "Range chart" colors horizontal bands of the Y-AXIS by VALUE
 * (e.g. <-20 one color, -20–0 another, 0–10 another...), with the actual
 * reading drawn as a plain line on top and a legend for the bands.
 *
 * This is a DIFFERENT widget from SensorBandChart.tsx despite the similar
 * name — that one shows a min/max envelope across redundant SENSORS (a
 * QA/agreement chart). SensorBandChart was originally built under the
 * assumption it satisfied this requirement; re-reading the spec more
 * carefully, it doesn't — this is the widget that actually does. Both are
 * kept: SensorBandChart is still useful for its own purpose.
 */
export default function ThresholdRangeChart({
  title,
  categories,
  data,
  bands,
  unit = "",
  lineColor = "#ffffff",
}: ThresholdRangeChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: false },
    },
    colors: [lineColor],
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
    tooltip: {
      theme: "dark",
      y: { formatter: (val) => `${val}${unit}` },
    },
    annotations: {
      yaxis: bands.map((band) => ({
        y: band.from,
        y2: band.to,
        fillColor: band.color,
        opacity: 0.15,
        borderColor: "transparent",
      })),
    },
  };

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">{title}</h2>
      <div className="h-64">
        <ReactApexChart
          options={options}
          series={[{ name: title, data }]}
          type="line"
          height="100%"
        />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-white/10 text-xs">
        {bands.map((band) => (
          <span key={band.label} className="flex items-center gap-1.5 text-gray-400">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: band.color }}
            />
            {band.label}
          </span>
        ))}
      </div>
    </div>
  );
}