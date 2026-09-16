import { Fragment } from "react";
import type { Station } from "@/lib/types";
import type { MatrixRow } from "@/lib/compareData";

export default function ComparisonMatrixTable({
  stations,
  colors,
  rows,
  rangeLabel,
  onExportXls,
}: {
  stations: Station[];
  colors: Record<string, string>;
  rows: MatrixRow[];
  rangeLabel: string;
  onExportXls: () => void;
}) {
  const online = stations.filter((s) => s.status === "online");
  const offline = stations.filter((s) => s.status === "offline");

  return (
    <div className="bg-card-bg p-5 rounded-2xl border border-border-line shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary-container">grid_view</span>
          <h2 className="text-base font-bold text-white">
            Comparative Telemetry Analytics Matrix — {rangeLabel}
          </h2>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-on-surface-variant">
          <span>Aggregation: Rolling {rangeLabel}</span>
          <button
            type="button"
            onClick={onExportXls}
            className="px-2.5 py-1 rounded bg-card-bg-subtle hover:bg-slate-700 text-primary-container border border-border-line transition-colors"
          >
            Download CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border-line">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="bg-[#080c14] text-on-surface-variant uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Parameter</th>
              {online.map((s) => (
                <th key={s.id} className="py-2.5 px-3 text-center" colSpan={3} style={{ color: colors[s.id] }}>
                  {s.name}
                </th>
              ))}
              {offline.map((s) => (
                <th key={s.id} className="py-2.5 px-3 text-center text-slate-500">
                  {s.name}
                </th>
              ))}
              <th className="py-2.5 px-3 text-right">Microclimate Delta (Δ)</th>
            </tr>
            <tr className="bg-[#080c14] text-on-surface-variant text-[10px] border-t border-border-line">
              <th />
              {online.map((s) => (
                <Fragment key={s.id}>
                  <th className="py-1.5 px-2 text-center font-normal">High</th>
                  <th className="py-1.5 px-2 text-center font-normal">Low</th>
                  <th className="py-1.5 px-2 text-center font-normal">Avg</th>
                </Fragment>
              ))}
              {offline.map((s) => (
                <th key={s.id} className="py-1.5 px-2 text-center font-normal">Last/Modeled</th>
              ))}
              <th className="py-1.5 px-2 text-right font-normal">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-line text-slate-300">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-on-surface-variant">
                      {row.icon}
                    </span>
                    {row.label} ({row.unit})
                  </div>
                </td>
                {online.map((s) => {
                  const stat = row.perOnlineStation[s.id];
                  return (
                    <Fragment key={s.id}>
                      <td className="py-3 px-2 text-center">{stat?.high ?? "—"}</td>
                      <td className="py-3 px-2 text-center">{stat?.low ?? "—"}</td>
                      <td className="py-3 px-2 text-center font-bold" style={{ color: colors[s.id] }}>
                        {stat?.avg ?? "—"}
                      </td>
                    </Fragment>
                  );
                })}
                {offline.map((s) => (
                  <td key={s.id} className="py-3 px-2 text-center text-slate-500">
                    {row.perOfflineStation[s.id] ?? "—"} (est)
                  </td>
                ))}
                <td className="py-3 px-3 text-right">
                  {row.delta ? (
                    <span className={row.delta.positive ? "text-secondary font-bold" : "text-primary-container font-bold"}>
                      {row.delta.text} <span className="text-on-surface-variant font-normal">{row.delta.tag}</span>
                    </span>
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}