import Sparkline from "./Sparkline";

interface FooterStat {
  label: string;
  value: string;
}

interface BigNumberCardProps {
  label: string;
  value: number | string;
  unit?: string;
  /** Tailwind text color class for the big value, e.g. "text-weather-warm". */
  accentColor?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  /** Optional row of small stats under a divider (e.g. Today High / Low). */
  footer?: FooterStat[];
}

/**
 * Generic "big number" widget: a label, a hero value, an optional trend
 * sparkline, and an optional row of small footer stats. This is the
 * reusable building block behind Temperature, Humidity, Pressure, and
 * Rainfall cards — per dashboard-reference-analysis.md's "big-number cards
 * with sparkline" widget type, rather than one hardcoded card per metric.
 *
 * Card chrome (gradient background, rounded-2xl, glow, border) is copied
 * from WeatherNode's hero widget in dashboard.blade.php. Left out on
 * purpose: the animated day/night sky illustration behind it, the 3D mouse
 * tilt effect, and drag-to-reorder — all decorative/interactive flourishes
 * specific to a single-station public page, not things this internal ops
 * dashboard needs. We can revisit any of them later if you want the polish.
 */
export default function BigNumberCard({
  label,
  value,
  unit,
  accentColor = "text-white",
  sparklineData,
  sparklineColor,
  footer,
}: BigNumberCardProps) {
  return (
    <div className="bg-gradient-to-br from-weather-card to-weather-card/50 rounded-2xl p-4 md:p-6 glow border border-white/10">
      <div className="text-xs text-gray-400 mb-2 md:mb-3">{label}</div>

      <div
        className={`text-4xl md:text-5xl font-bold font-display leading-none data-value ${accentColor}`}
      >
        {value}
        {unit && (
          <span className="text-xl md:text-2xl text-gray-400 ml-1">
            {unit}
          </span>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3 -mx-2">
          <Sparkline data={sparklineData} color={sparklineColor} />
        </div>
      )}

      {footer && footer.length > 0 && (
        <div
          className="grid gap-2 md:gap-4 mt-4 pt-4 border-t border-white/10"
          style={{
            gridTemplateColumns: `repeat(${footer.length}, minmax(0, 1fr))`,
          }}
        >
          {footer.map((stat) => (
            <div key={stat.label}>
              <div className="text-[10px] md:text-xs text-gray-400">
                {stat.label}
              </div>
              <div className="text-lg md:text-xl font-bold data-value">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}