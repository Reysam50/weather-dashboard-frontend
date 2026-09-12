import Papa from "papaparse";

export interface ParsedUploadRow {
  [key: string]: string;
}

export interface ParsedUpload {
  headers: string[];
  rows: ParsedUploadRow[];
  missingRequiredColumns: string[];
}

/**
 * Columns FR-11.3 requires the uploaded w_log.txt to have — a subset of
 * StationReading's fields (lib/types.ts). The requirement is that this
 * file's shape matches the automatic telemetry payload (same idea as
 * FR-11.2's automatic backfill, just delivered as a file instead of the
 * webhook), so these names are deliberately identical to StationReading's.
 */
export const REQUIRED_UPLOAD_COLUMNS = [
  "timestamp",
  "airTemp",
  "pressure",
  "humidity",
  "minAvgRain_mm",
];

/**
 * Parses an uploaded CSV's text content and checks it against the
 * required column list. Uses papaparse rather than a hand-rolled
 * split(",") — real CSV files can have quoted fields containing commas,
 * which naive splitting breaks on.
 */
export function parseUploadFile(csvText: string): ParsedUpload {
  const result = Papa.parse<ParsedUploadRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = result.meta.fields ?? [];
  const missingRequiredColumns = REQUIRED_UPLOAD_COLUMNS.filter(
    (col) => !headers.includes(col)
  );

  return {
    headers,
    rows: result.data,
    missingRequiredColumns,
  };
}