"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { PieSeriesItem } from "./PieChartWidget";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface BarChartWidgetProps {
  title: string;
  series: PieSeriesItem[];
  unit?: string;
}

const DEFAULT_COLORS = ["#f59e0b", "#06b6d4", "#3b82f6", "#a78bfa", "#22c55e"];

export default function BarChartWidget({
  title,
  series,
  unit = "",
}: BarChartWidgetProps) {
  const total = series.reduce((sum, s) => sum + s.value, 0);
  const colors = series.map(
    (s, i) => s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
  );

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: false },
    },
    plotOptions: {
      bar: { distributed: true, borderRadius: 4, columnWidth: "55%" },
    },
    colors,
    xaxis: {
      categories: series.map((s) => s.name),
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
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
      theme: "dark",
      y: { formatter: (val) => `${val}${unit}` },
    },
  };

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">{title}</h2>
      <div className="h-56">
        <ReactApexChart
          options={options}
          series={[{ name: title, data: series.map((s) => s.value) }]}
          type="bar"
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