import Sparkline from "./Sparkline";
import { formatTimeAgo } from "@/lib/formatTimeAgo";

interface FooterStat {
  label: string;
  value: string;
}

interface BigNumberCardProps {
  label: string;
  value: number | string;
  unit?: string;
  accentColor?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  footer?: FooterStat[];
  /** ISO timestamp of this reading — shown as "Last update Xd ago". */
  lastUpdated?: string;
}

export default function BigNumberCard({
  label,
  value,
  unit,
  accentColor = "text-white",
  sparklineData,
  sparklineColor,
  footer,
  lastUpdated,
}: BigNumberCardProps) {
  return (
    <div className="bg-gradient-to-br from-weather-card to-weather-card/50 rounded-2xl p-4 md:p-6 glow border border-white/10">
      <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
        <div className="text-xs text-gray-400">{label}</div>
        {lastUpdated && (
          <div className="text-[10px] text-gray-500 shrink-0 data-value">
            {formatTimeAgo(lastUpdated)}
          </div>
        )}
      </div>

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