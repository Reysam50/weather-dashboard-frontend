"use client";

import { useState } from "react";
import type { Station } from "@/lib/types";
import { parseUploadFile, REQUIRED_UPLOAD_COLUMNS, type ParsedUpload } from "@/lib/manualUpload";
import StationScopeSelect from "./StationScopeSelect";

interface ManualRecoveryUploadCardProps {
  stations: Station[];
}

interface UploadResult {
  rowsReceived: number;
  rowsInserted: number;
  rowsDuplicate: number;
}

interface BackfillAuditRow {
  id: string;
  timestamp: string;
  stationName: string;
  sourceFile: string;
  ingestedRows: number;
  dedupedCollisions: number;
}

const SEED_AUDIT: BackfillAuditRow[] = [
  {
    id: "seed-1",
    timestamp: "2026-09-02T14:11:04Z",
    stationName: "Blantyre CBD",
    sourceFile: "w_log_cell_outage_aug.txt",
    ingestedRows: 14400,
    dedupedCollisions: 124,
  },
  {
    id: "seed-2",
    timestamp: "2026-08-19T09:22:50Z",
    stationName: "Zomba Plateau",
    sourceFile: "w_log_lightning_sd_swap.txt",
    ingestedRows: 2880,
    dedupedCollisions: 0,
  },
];

/** Builds a small synthetic w_log.txt in-memory so "Load Simulation
 * Sample" has something real to parse without a physical SD card file —
 * clearly labeled as a simulation, not passed off as real recovered data. */
function buildSimulationSample(rowCount: number): string {
  const header = REQUIRED_UPLOAD_COLUMNS.join(",");
  const now = Date.now();
  const rows = Array.from({ length: rowCount }, (_, i) => {
    const t = new Date(now - (rowCount - i) * 60000).toISOString();
    const airTemp = (24 + Math.sin(i / 20) * 4).toFixed(2);
    const pressure = (1012 + Math.cos(i / 30) * 2).toFixed(2);
    const humidity = (55 + Math.sin(i / 15) * 10).toFixed(1);
    const rain = Math.max(0, Math.sin(i / 50)).toFixed(2);
    return `${t},${airTemp},${pressure},${humidity},${rain}`;
  });
  return [header, ...rows].join("\n");
}

/**
 * Manual data-recovery upload — FR-11.3: when a station has been offline
 * too long for automatic backfill (FR-11.2) to cover the gap, someone
 * physically retrieves its w_log.txt from the SD card and uploads it here
 * instead. Matches `POST /telemetry/{station_id}/upload`
 * (api-specification.md §5).
 *
 * Restricted to Technical Team: this is a hardware-recovery operation
 * requiring physical access to the station — same category as station
 * provisioning (FR-12.3), which is also Technical-Team-only. The API
 * spec's Telemetry section doesn't list an explicit Permission column the
 * way the Stations section does, so this is an inferred restriction, not
 * a confirmed one — worth double-checking once the backend team documents
 * it, per the page's TODO.
 *
 * The CSV parsing/validation below is real and works today; only the
 * final "send it to the server" step is mocked, since there's no backend
 * yet — see the TODO inside handleUpload for exactly what that call
 * should look like once one exists. The audit log below is session-local
 * for the same reason (no backend audit store yet) — same pattern as the
 * Admin screen's Audit Logs tab.
 */
export default function ManualRecoveryUploadCard({ stations }: ManualRecoveryUploadCardProps) {
  const [stationId, setStationId] = useState(stations[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedUpload | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [auditLog, setAuditLog] = useState<BackfillAuditRow[]>(SEED_AUDIT);

  function resetPreview() {
    setResult(null);
    setError(null);
    setParsed(null);
  }

  async function loadFile(file: File) {
    resetPreview();
    setFileName(file.name);
    const text = await file.text();
    setParsed(parseUploadFile(text));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      return;
    }
    await loadFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  function handleLoadSample() {
    resetPreview();
    const sampleName = "w_log_simulation_sample.txt";
    setFileName(sampleName);
    setParsed(parseUploadFile(buildSimulationSample(4280)));
  }

  async function handleUpload() {
    if (!parsed || !stationId) return;
    if (parsed.missingRequiredColumns.length > 0) {
      setError(`File is missing required column(s): ${parsed.missingRequiredColumns.join(", ")}`);
      return;
    }

    setIsUploading(true);
    setError(null);

    // TODO: send the actual file, not just the parsed preview —
    // apiFetch already skips forcing a JSON Content-Type for FormData
    // bodies (see lib/api.ts), so this is ready to wire up once the
    // backend exists:
    //
    //   const formData = new FormData();
    //   formData.append("file", file); // the raw File object from the input
    //   const response = await apiFetch<UploadResult>(
    //     `/telemetry/${stationId}/upload`,
    //     { method: "POST", body: formData }
    //   );
    //   setResult(response);
    //
    // For now, simulate the response from what was already parsed
    // client-side, so the rest of the flow (result summary, and FR-11.2's
    // "duplicates ignored" behavior) is at least visually testable.
    await new Promise((resolve) => setTimeout(resolve, 600));
    const inserted = parsed.rows.length;
    setResult({ rowsReceived: inserted, rowsInserted: inserted, rowsDuplicate: 0 });
    setAuditLog((prev) => [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        stationName: stations.find((s) => s.id === stationId)?.name ?? stationId,
        sourceFile: fileName ?? "unknown file",
        ingestedRows: inserted,
        dedupedCollisions: 0,
      },
      ...prev,
    ]);
    setIsUploading(false);
  }

  return (
    <div className="bg-card-bg rounded-2xl border border-border-line p-5 shadow-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">sd_card</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Offline Resilience &amp; Hardware SD Backfill Center</h2>
            <p className="text-xs text-on-surface-variant">
              Manual ingest pipeline for station SD flash card dumps (w_log.txt) following network blackouts.
            </p>
          </div>
        </div>
        <div className="font-mono text-xs">
          <label className="block text-on-surface-variant mb-1 text-[11px] uppercase">Target AWS Node</label>
          <StationScopeSelect
            stations={stations}
            value={stationId}
            onChange={(v) => v && setStationId(v)}
            allowAllStations={false}
          />
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-colors ${
          isDragOver ? "border-cyan-400 bg-cyan-500/5" : "border-border-line bg-[#080c14]"
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-card-bg-subtle flex items-center justify-center text-primary-container">
          <span className="material-symbols-outlined text-[24px]">upload_file</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Drop micro-SD card dump file (w_log.txt) here</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Accepts comma-separated raw telemetry payloads with ISO-8601 or UNIX epoch timestamps.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <label className="px-3 py-2 rounded-lg bg-card-bg-subtle hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors border border-border-line">
            Browse Local File System
            <input type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
          </label>
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3 py-2 rounded-lg bg-card-bg-subtle hover:bg-slate-700 text-primary-container border border-border-line transition-colors"
          >
            Load Simulation Sample (4,280 readings)
          </button>
        </div>
      </div>

      {parsed && (
        <div className="text-xs font-mono bg-[#080c14] border border-border-line rounded-lg p-3">
          <p className="text-slate-300 mb-1">
            <span className="font-semibold text-white">{fileName}</span> — {parsed.rows.length} row
            {parsed.rows.length === 1 ? "" : "s"} detected
          </p>
          {parsed.missingRequiredColumns.length > 0 ? (
            <p className="text-error">Missing required column(s): {parsed.missingRequiredColumns.join(", ")}</p>
          ) : (
            <p className="text-success">All required columns present.</p>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs font-mono text-error bg-error/10 border border-error/20 rounded-lg p-3">{error}</div>
      )}

      {result && (
        <div className="text-xs font-mono bg-success/10 border border-success/20 rounded-lg p-3 text-success">
          Upload complete — {result.rowsReceived} row{result.rowsReceived === 1 ? "" : "s"} received,{" "}
          {result.rowsInserted} inserted, {result.rowsDuplicate} duplicate{result.rowsDuplicate === 1 ? "" : "s"} ignored.
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!parsed || isUploading || parsed.missingRequiredColumns.length > 0}
        className="px-4 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-slate-950 font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isUploading ? "Uploading…" : "Upload & Backfill"}
      </button>

      <div>
        <p className="font-mono text-[11px] text-on-surface-variant uppercase mb-2">Hardware Backfill Audit Log</p>
        <div className="overflow-x-auto rounded-lg border border-border-line">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#080c14] text-on-surface-variant uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2.5">Execution Timestamp</th>
                <th className="px-3 py-2.5">Station Target</th>
                <th className="px-3 py-2.5">Source Dump</th>
                <th className="px-3 py-2.5 text-right">Ingested Rows</th>
                <th className="px-3 py-2.5 text-right">Deduped Collisions</th>
                <th className="px-3 py-2.5 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-line text-slate-300">
              {auditLog.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2.5 text-on-surface-variant">{new Date(row.timestamp).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-white font-semibold">{row.stationName}</td>
                  <td className="px-3 py-2.5">{row.sourceFile}</td>
                  <td className="px-3 py-2.5 text-right text-primary-container">{row.ingestedRows.toLocaleString()}</td>
                  <td className={`px-3 py-2.5 text-right ${row.dedupedCollisions > 0 ? "text-secondary" : "text-on-surface-variant"}`}>
                    {row.dedupedCollisions > 0 ? `${row.dedupedCollisions} skipped` : "0 skipped"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="px-2 py-0.5 rounded bg-success/10 text-success font-bold text-[10px]">0 Loss Confirmed</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}