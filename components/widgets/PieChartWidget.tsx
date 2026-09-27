"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export interface PieSeriesItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartWidgetProps {
  title: string;
  series: PieSeriesItem[];
  unit?: string;
}

const DEFAULT_COLORS = ["#f59e0b", "#06b6d4", "#3b82f6", "#a78bfa", "#22c55e"];

export default function PieChartWidget({
  title,
  series,
  unit = "",
}: PieChartWidgetProps) {
  const total = series.reduce((sum, s) => sum + s.value, 0);
  const colors = series.map(
    (s, i) => s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
  );

  const options: ApexOptions = {
    chart: { type: "pie", background: "transparent", animations: { enabled: false } },
    labels: series.map((s) => s.name),
    colors,
    legend: {
      position: "bottom",
      labels: { colors: "#d1d5db" },
    },
    dataLabels: {
      formatter: (val: number) => `${val.toFixed(0)}%`,
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (val) => `${val}${unit}` },
    },
    stroke: { colors: ["#1a2332"] },
  };

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">{title}</h2>
      <div className="h-64">
        <ReactApexChart
          options={options}
          series={series.map((s) => s.value)}
          type="pie"
          height="100%"
        />
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-1 text-xs">
        {series.map((s, i) => (
          <div key={s.name} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-gray-300 truncate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: colors[i] }}
              />
              {s.name}
            </span>
            <span className="text-gray-400 data-value shrink-0">
              {s.value}
              {unit}
            </span>
          </div>
        ))}
        <div className="col-span-2 flex items-center justify-between pt-1 mt-1 border-t border-white/5 font-semibold">
          <span>Total</span>
          <span className="data-value">
            {total}
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}