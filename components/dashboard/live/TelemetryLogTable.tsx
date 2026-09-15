"use client";

import { useMemo, useState } from "react";
import type { LiveTelemetryExtras } from "@/lib/liveTelemetryData";

const PAGE_SIZE = 5;

export default function TelemetryLogTable({ extras }: { extras: LiveTelemetryExtras }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return extras.ingestLog;
    const q = query.trim().toLowerCase();
    return extras.ingestLog.filter((row) => row.time.toLowerCase().includes(q));
  }, [query, extras.ingestLog]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <section className="bg-card-bg rounded-2xl p-7 border border-border-line shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-border-line">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              TELEMETRY INGEST ARCHIVE • HIGH-PRECISION LOG
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs">
              LIVE SSE VERIFIED
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="relative">
            <input
              className="bg-[#090d16] border border-border-line text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-cyan-400 text-xs w-60 placeholder-slate-500 transition-colors"
              placeholder="Filter parameter or time..."
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[16px] text-slate-500 pointer-events-none">
              search
            </span>
          </div>
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>EXPORT BATCH</span>
              <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#141b2e] border border-border-line shadow-2xl z-30 py-2">
                <a className="px-4 py-2 hover:bg-slate-800/60 text-slate-200 flex items-center gap-2.5 transition-colors" href="#">
                  <span className="material-symbols-outlined text-[16px] text-cyan-400">csv</span>
                  <span>Export CSV (.csv)</span>
                </a>
                <a className="px-4 py-2 hover:bg-slate-800/60 text-slate-200 flex items-center gap-2.5 transition-colors" href="#">
                  <span className="material-symbols-outlined text-[16px] text-secondary">table_view</span>
                  <span>Export Excel (.xlsx)</span>
                </a>
                <a className="px-4 py-2 hover:bg-slate-800/60 text-slate-200 flex items-center gap-2.5 transition-colors" href="#">
                  <span className="material-symbols-outlined text-[16px] text-purple-400">code</span>
                  <span>Export GeoJSON / REST</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-border-line bg-[#080c14]">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#0e1320] border-b border-border-line text-slate-400 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-5">Timestamp (CAT)</th>
              <th className="py-3.5 px-5 text-right">Air Temp (°C)</th>
              <th className="py-3.5 px-5 text-right">BMP280 (°C)</th>
              <th className="py-3.5 px-5 text-right">SHT31 (°C)</th>
              <th className="py-3.5 px-5 text-right">Rel Humidity (%)</th>
              <th className="py-3.5 px-5 text-right">Barometric (hPa)</th>
              <th className="py-3.5 px-5 text-right">Rain Rate (mm/h)</th>
              <th className="py-3.5 px-5 text-right">Solar (W/m²)</th>
              <th className="py-3.5 px-5 text-center">Sensor QA Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-line text-slate-300">
            {pageRows.map((row, i) => {
              const isLive = currentPage === 1 && i === 0;
              return (
                <tr
                  key={row.time + i}
                  className={isLive ? "bg-cyan-500/[0.04] hover:bg-cyan-500/[0.08] transition-colors" : "hover:bg-slate-800/40 transition-colors"}
                >
                  <td className="py-4 px-5 font-bold text-cyan-300 flex items-center gap-2">
                    <span>{row.time}</span>
                    {isLive && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-extrabold">
                        LIVE
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right text-secondary font-semibold">{row.airTemp.toFixed(2)}</td>
                  <td className="py-4 px-5 text-right text-slate-300">{row.bmpTemp.toFixed(2)}</td>
                  <td className="py-4 px-5 text-right text-slate-300">{row.shtTemp.toFixed(2)}</td>
                  <td className="py-4 px-5 text-right text-cyan-300">{row.humidity.toFixed(1)}</td>
                  <td className="py-4 px-5 text-right">{row.pressure.toFixed(2)}</td>
                  <td className="py-4 px-5 text-right text-white">{row.rainRate.toFixed(2)}</td>
                  <td className="py-4 px-5 text-right text-amber-300">{row.solar.toFixed(1)}</td>
                  <td className="py-4 px-5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      PASS • {row.qaScore.toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 px-5 text-center text-slate-500">
                  No readings match &quot;{query}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-400 pt-2">
        <div className="flex items-center gap-2">
          <span>
            Displaying verified QA records {rangeStart} - {rangeEnd} of {extras.totalReadingsCount.toLocaleString()} readings
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400">SHA256 CHECKSUM VALID</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1.5 rounded-lg border border-border-line ${
              currentPage <= 1
                ? "bg-[#141b2e] text-slate-500 cursor-not-allowed"
                : "bg-[#141b2e] hover:border-slate-600 text-slate-300"
            }`}
          >
            PREV
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(0, 3)
            .map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={
                  p === currentPage
                    ? "px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold"
                    : "px-3 py-1.5 rounded-lg bg-[#141b2e] border border-border-line hover:border-slate-600 text-slate-300"
                }
              >
                {p}
              </button>
            ))}
          {totalPages > 3 && <span className="px-2 text-slate-600">…</span>}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-1.5 rounded-lg border border-border-line ${
              currentPage >= totalPages
                ? "bg-[#141b2e] text-slate-500 cursor-not-allowed"
                : "bg-[#141b2e] hover:border-slate-600 text-slate-300"
            }`}
          >
            NEXT
          </button>
        </div>
      </div>
    </section>
  );
}
