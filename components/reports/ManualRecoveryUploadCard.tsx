"use client";

import { useState } from "react";
import type { Station } from "@/lib/types";
import { parseUploadFile, type ParsedUpload } from "@/lib/manualUpload";
import StationScopeSelect from "./StationScopeSelect";

interface ManualRecoveryUploadCardProps {
  stations: Station[];
}

interface UploadResult {
  rowsReceived: number;
  rowsInserted: number;
  rowsDuplicate: number;
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
 * should look like once one exists.
 */
export default function ManualRecoveryUploadCard({
  stations,
}: ManualRecoveryUploadCardProps) {
  const [stationId, setStationId] = useState(stations[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedUpload | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setResult(null);
    setError(null);
    setParsed(null);

    if (!file) {
      setFileName(null);
      return;
    }

    setFileName(file.name);
    const text = await file.text();
    setParsed(parseUploadFile(text));
  }

  async function handleUpload() {
    if (!parsed || !stationId) return;
    if (parsed.missingRequiredColumns.length > 0) {
      setError(
        `File is missing required column(s): ${parsed.missingRequiredColumns.join(", ")}`
      );
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
    setResult({
      rowsReceived: parsed.rows.length,
      rowsInserted: parsed.rows.length,
      rowsDuplicate: 0,
    });
    setIsUploading(false);
  }

  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 p-4 md:p-6">
      <h2 className="text-sm font-semibold text-gray-200 mb-1">
        Manual Data Recovery
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        Upload a station&apos;s w_log.txt when it&apos;s been offline too
        long for automatic backfill to cover the gap (FR-11.3).
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Station</label>
          <StationScopeSelect
            stations={stations}
            value={stationId}
            onChange={(v) => v && setStationId(v)}
            allowAllStations={false}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Log file (w_log.txt)
          </label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-gray-200 hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
          />
        </div>

        {parsed && (
          <div className="text-xs bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-gray-300 mb-1">
              <span className="font-medium">{fileName}</span> —{" "}
              {parsed.rows.length} row{parsed.rows.length === 1 ? "" : "s"}{" "}
              detected
            </p>
            {parsed.missingRequiredColumns.length > 0 ? (
              <p className="text-red-400">
                Missing required column(s):{" "}
                {parsed.missingRequiredColumns.join(", ")}
              </p>
            ) : (
              <p className="text-green-400">All required columns present.</p>
            )}
          </div>
        )}

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {result && (
          <div className="text-xs bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400">
            Upload complete — {result.rowsReceived} row
            {result.rowsReceived === 1 ? "" : "s"} received,{" "}
            {result.rowsInserted} inserted, {result.rowsDuplicate} duplicate
            {result.rowsDuplicate === 1 ? "" : "s"} ignored.
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={
            !parsed || isUploading || parsed.missingRequiredColumns.length > 0
          }
          className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading…" : "Upload"}
        </button>
      </div>
    </div>
  );
}