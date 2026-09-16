"use client";

import { useState } from "react";
import type { Station, ReportFormat } from "@/lib/types";
import StationScopeSelect from "./StationScopeSelect";

interface QuickExportCardProps {
  stations: Station[];
  defaultStationId: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

const TELEMETRY_CHANNELS = [
  { id: "airTemp", label: "Air Temp (°C)" },
  { id: "humidity", label: "Relative Humidity (%)" },
  { id: "pressure", label: "Pressure (hPa)" },
  { id: "minAvgRain_mm", label: "minAvgRain_mm" },
  { id: "minRainRaw", label: "minRain1/2 (Raw)" },
  { id: "solar", label: "Solar Irradiance" },
  { id: "windVector", label: "Wind Vector (m/s)" },
  { id: "batteryBus", label: "Battery & Bus (V)" },
  { id: "qaFlag", label: "QA Checksum & Flag" },
];

const RANGE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Past 7D" },
  { id: "month", label: "Month" },
  { id: "custom", label: "Custom" },
] as const;

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Ad-hoc data export — FR-8: any date range, CSV/XLS/XLSX/PDF, one station
 * at a time. Hits `GET /telemetry/{station_id}/export?from=&to=&format=`
 * directly (api-specification.md §5) as a plain navigation rather than
 * through lib/api.ts's apiFetch, because apiFetch always parses a JSON
 * response body — a file download needs the browser to navigate to the URL
 * itself so it can handle the Content-Disposition header and save the file.
 *
 * Note: the export endpoint's signature is per-station only — there's no
 * "all stations" export in the spec, unlike scheduled reports (which do
 * support stationId: null for Admin/Technical Team). So this form doesn't
 * offer an "All Stations" option even though ScheduleReportCard does.
 *
 * TODO (frontend developer): the channel checkboxes below add a
 * `channels=` query param the backend doesn't parse yet — harmless
 * (it'll just be ignored and return every column) until that filtering
 * is implemented server-side.
 */
export default function QuickExportCard({ stations, defaultStationId }: QuickExportCardProps) {
  const [stationId, setStationId] = useState(defaultStationId);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [format, setFormat] = useState<ReportFormat>("csv");
  const [activePreset, setActivePreset] = useState<(typeof RANGE_PRESETS)[number]["id"] | null>(null);
  const [channels, setChannels] = useState<string[]>(TELEMETRY_CHANNELS.map((c) => c.id));

  const canSubmit = stationId && from && to;

  function applyPreset(preset: (typeof RANGE_PRESETS)[number]["id"]) {
    setActivePreset(preset);
    const today = new Date();
    if (preset === "today") {
      setFrom(toDateInputValue(today));
      setTo(toDateInputValue(today));
    } else if (preset === "7d") {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      setFrom(toDateInputValue(start));
      setTo(toDateInputValue(today));
    } else if (preset === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setFrom(toDateInputValue(start));
      setTo(toDateInputValue(today));
    }
    // "custom" leaves from/to as-is for manual editing
  }

  function toggleChannel(id: string) {
    setChannels((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleExport(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const channelsParam = channels.length > 0 ? `&channels=${channels.join(",")}` : "";
    const url = `${API_BASE}/telemetry/${stationId}/export?from=${from}&to=${to}&format=${format}${channelsParam}`;
    window.open(url, "_blank");
  }

  return (
    <div className="bg-card-bg rounded-2xl p-5 border border-border-line shadow-md h-full flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-container/10 text-primary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">database</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Quick Data Export Engine</h2>
            <p className="text-xs text-on-surface-variant">Extract calibrated telemetry metrics across custom temporal windows.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleExport} className="space-y-4 font-mono text-xs">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-on-surface-variant uppercase text-[11px]">Target Observation Post / Scope</label>
          </div>
          <StationScopeSelect
            stations={stations}
            value={stationId}
            onChange={(v) => v && setStationId(v)}
            allowAllStations={false}
          />
        </div>

        <div>
          <label className="text-on-surface-variant uppercase text-[11px] block mb-1.5">Temporal Window</label>
          <div className="flex items-center gap-1 bg-[#080c14] p-1 rounded-lg border border-border-line mb-2">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`flex-1 px-2 py-1.5 rounded transition-colors ${
                  activePreset === preset.id
                    ? "bg-cyan-500/20 text-primary-container font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-on-surface-variant mb-1">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setActivePreset(null);
                }}
                required
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-on-surface-variant mb-1">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setActivePreset(null);
                }}
                required
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-on-surface-variant uppercase text-[11px]">Included Telemetry Channels</label>
            <button
              type="button"
              onClick={() => setChannels(channels.length === TELEMETRY_CHANNELS.length ? [] : TELEMETRY_CHANNELS.map((c) => c.id))}
              className="text-primary-container hover:text-primary text-[11px]"
            >
              {channels.length === TELEMETRY_CHANNELS.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 bg-[#080c14] border border-border-line rounded-lg p-3">
            {TELEMETRY_CHANNELS.map((channel) => (
              <label key={channel.id} className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.includes(channel.id)}
                  onChange={() => toggleChannel(channel.id)}
                  className={channel.id === "qaFlag" ? "accent-amber-400" : "accent-cyan-400"}
                />
                {channel.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-on-surface-variant uppercase text-[11px] block mb-1.5">Export Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormat)}
            className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="csv">Standard CSV (.csv)</option>
            <option value="xls">Excel Legacy (.xls)</option>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="pdf">PDF Report (.pdf)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-2.5 rounded-lg bg-primary-container hover:bg-primary text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">bolt</span>
          Generate &amp; Download Data Export
        </button>
      </form>
    </div>
  );
}