"use client";

import { useMemo, useState } from "react";
import type { GeneratedReport, Station, ReportFormat } from "@/lib/types";
import { FORMAT_STYLES, FORMAT_ICONS, pseudoFileSizeLabel } from "@/lib/reportsDisplay";

interface GeneratedReportsCardProps {
  reports: GeneratedReport[];
  stations: Station[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * List of already-generated report files — FR-9.2: reports are stored
 * server-side as files, and downloading is the only delivery mechanism in
 * v1 (no email/push). Matches `GET /reports/generated` +
 * `GET /reports/generated/{id}/download` (api-specification.md §6).
 */
export default function GeneratedReportsCard({ reports, stations }: GeneratedReportsCardProps) {
  const [query, setQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<"all" | ReportFormat>("all");
  const [inspecting, setInspecting] = useState<GeneratedReport | null>(null);

  function stationName(id: string | null) {
    if (id === null) return "All Stations";
    return stations.find((s) => s.id === id)?.name ?? "Unknown station";
  }

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (formatFilter !== "all" && r.format !== formatFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!r.fileName.toLowerCase().includes(q) && !stationName(r.stationId).toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [reports, query, formatFilter, stations]);

  return (
    <div className="bg-card-bg rounded-2xl border border-border-line overflow-hidden shadow-md">
      <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-container/10 text-primary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">folder_open</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Archive of Stored Reports &amp; Datasets
              <span className="px-2 py-0.5 rounded-full bg-card-bg-subtle text-on-surface-variant font-mono text-[10px]">
                {reports.length} FILES
              </span>
            </h2>
            <p className="text-xs text-on-surface-variant">Immutable storage artifacts ready for retrieval.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-slate-500">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter filenames or stations..."
              className="bg-[#080c14] border border-border-line rounded-lg pl-8 pr-3 py-1.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-56"
            />
          </div>
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as typeof formatFilter)}
            className="bg-[#080c14] border border-border-line rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
          >
            <option value="all">All Formats</option>
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="xls">XLS</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#080c14] text-on-surface-variant uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Storage Artifact / File Name</th>
              <th className="px-4 py-3">Observatory Scope</th>
              <th className="px-4 py-3">Payload Size</th>
              <th className="px-4 py-3">Timestamp Generated</th>
              <th className="px-4 py-3">Encoding</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-line text-slate-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">
                  {reports.length === 0 ? "No reports generated yet." : "No files match your filters."}
                </td>
              </tr>
            ) : (
              filtered.map((report) => (
                <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-white font-semibold">
                      <span className={`material-symbols-outlined text-[16px] ${FORMAT_STYLES[report.format].split(" ")[1]}`}>
                        {FORMAT_ICONS[report.format]}
                      </span>
                      {report.fileName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{stationName(report.stationId)}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{pseudoFileSizeLabel(report.fileName)}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {new Date(report.generatedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${FORMAT_STYLES[report.format]}`}>
                      {report.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInspecting(report)}
                        className="px-2.5 py-1 rounded bg-card-bg-subtle hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        Inspect
                      </button>
                      <a
                        href={`${API_BASE}/reports/generated/${report.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-primary-container/20 hover:bg-primary-container/30 text-primary-container font-semibold transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {inspecting && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setInspecting(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm bg-card-bg border border-border-hover rounded-2xl shadow-2xl p-5 space-y-3 font-mono text-xs">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-bold text-white">File Details</h3>
              <button type="button" onClick={() => setInspecting(null)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-1.5 text-on-surface-variant">
              <div className="flex justify-between"><span>Filename</span><span className="text-white">{inspecting.fileName}</span></div>
              <div className="flex justify-between"><span>Scope</span><span className="text-white">{stationName(inspecting.stationId)}</span></div>
              <div className="flex justify-between"><span>Format</span><span className="text-white uppercase">{inspecting.format}</span></div>
              <div className="flex justify-between"><span>Size</span><span className="text-white">{pseudoFileSizeLabel(inspecting.fileName)}</span></div>
              <div className="flex justify-between"><span>Generated</span><span className="text-white">{new Date(inspecting.generatedAt).toLocaleString()}</span></div>
            </div>
            <a
              href={`${API_BASE}/reports/generated/${inspecting.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-2 rounded-lg bg-primary-container text-slate-950 font-bold hover:bg-primary transition-colors"
            >
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}