"use client";

import { useState } from "react";
import type { Station, ReportFormat } from "@/lib/types";
import StationScopeSelect from "./StationScopeSelect";

interface QuickExportCardProps {
  stations: Station[];
  defaultStationId: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * Ad-hoc data export — FR-8: any date range, CSV/XLS/XLSX, one station at a
 * time. Hits `GET /telemetry/{station_id}/export?from=&to=&format=`
 * directly (api-specification.md §5) as a plain navigation rather than
 * through lib/api.ts's apiFetch, because apiFetch always parses a JSON
 * response body — a file download needs the browser to navigate to the URL
 * itself so it can handle the Content-Disposition header and save the file.
 *
 * Note: the export endpoint's signature is per-station only — there's no
 * "all stations" export in the spec, unlike scheduled reports (which do
 * support stationId: null for Admin/Technical Team). So this form doesn't
 * offer an "All Stations" option even though ScheduleReportCard does.
 */
export default function QuickExportCard({ stations, defaultStationId }: QuickExportCardProps) {
  const [stationId, setStationId] = useState(defaultStationId);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [format, setFormat] = useState<ReportFormat>("csv");

  const canSubmit = stationId && from && to;

  function handleExport(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const url = `${API_BASE}/telemetry/${stationId}/export?from=${from}&to=${to}&format=${format}`;
    window.open(url, "_blank");
  }

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10 h-full">
      <h2 className="text-sm font-semibold text-gray-200 mb-1">Quick Export</h2>
      <p className="text-xs text-gray-400 mb-4">
        Download raw readings for a date range (FR-8).
      </p>

      <form onSubmit={handleExport} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Station</label>
          <StationScopeSelect
            stations={stations}
            value={stationId}
            onChange={(v) => v && setStationId(v)}
            allowAllStations={false}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
              className="input-dark w-full px-3 py-2 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              className="input-dark w-full px-3 py-2 rounded-lg text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormat)}
            className="input-dark w-full px-3 py-2 rounded-lg text-sm text-white"
          >
            <option value="csv">CSV</option>
            <option value="xls">XLS</option>
            <option value="xlsx">XLSX</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Export
        </button>
      </form>
    </div>
  );
}