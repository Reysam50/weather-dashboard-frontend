"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

// ApexCharts touches `window` as soon as it's imported, which doesn't exist
// during Next.js's server-side render and would crash the build. dynamic()
// with ssr:false tells Next.js "only load this in the browser" — every
// chart component in this project will need this same pattern, so it's
// worth remembering rather than re-discovering the error each time.
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface SparklineProps {
  /** Recent values, oldest first — e.g. the last few hours of a reading. */
  data: number[];
  /** Line/fill color as a hex string. Defaults to the WeatherNode accent blue. */
  color?: string;
}

/**
 * Minimal trend line with no axes, gridlines, or legend — just the shape of
 * recent history under a big number. Used inside BigNumberCard.tsx.
 */
export default function Sparkline({ data, color = "#3b82f6" }: SparklineProps) {
  const options: ApexOptions = {
    chart: {
      type: "area",
      sparkline: { enabled: true }, // strips everything except the line + fill
      animations: { enabled: false },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0,
        stops: [0, 90, 100],
      },
    },
    colors: [color],
    tooltip: { enabled: false },
  };

  return (
    <div className="h-12 w-full">
      <ReactApexChart
        options={options}
        series={[{ data }]}
        type="area"
        height="100%"
      />
    </div>
  );
}