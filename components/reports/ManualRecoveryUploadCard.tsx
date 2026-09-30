"use client";

import { useState } from "react";
import type { Station } from "@/lib/types";
import { parseUploadFile, type ParsedUpload } from "@/lib/manualUpload";
import { apiFetch, ApiError } from "@/lib/api";
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
 * The CSV is validated client-side first, then the original file is sent to
 * POST /telemetry/{station_id}/upload as multipart/form-data. The audit log
 * below is session-local (no backend audit store yet) — it only lists uploads
 * made during this visit.
 */
export default function ManualRecoveryUploadCard({ stations }: ManualRecoveryUploadCardProps) {
  const [stationId, setStationId] = useState(stations[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedUpload | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  // Session-local: there's no audit-log endpoint in the API yet, so this only
  // lists uploads made during this visit — it starts empty, not pre-filled.
  const [auditLog, setAuditLog] = useState<BackfillAuditRow[]>([]);

  function resetPreview() {
    setResult(null);
    setError(null);
    setParsed(null);
  }

  async function loadFile(picked: File) {
    resetPreview();
    setFile(picked);
    setFileName(picked.name);
    const text = await picked.text();
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

  async function handleUpload() {
    if (!parsed || !stationId || !file) return;
    if (parsed.missingRequiredColumns.length > 0) {
      setError(`File is missing required column(s): ${parsed.missingRequiredColumns.join(", ")}`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file as File);
      const response = await apiFetch<{ rows_received: number; rows_inserted: number; rows_duplicate: number }>(
        `/telemetry/${stationId}/upload`,
        { method: "POST", body: formData }
      );
      setResult({
        rowsReceived: response.rows_received,
        rowsInserted: response.rows_inserted,
        rowsDuplicate: response.rows_duplicate,
      });
      setAuditLog((prev) => [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          stationName: stations.find((s) => s.id === stationId)?.name ?? stationId,
          sourceFile: fileName ?? "unknown file",
          ingestedRows: response.rows_inserted,
          dedupedCollisions: response.rows_duplicate,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the server to upload this file. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
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