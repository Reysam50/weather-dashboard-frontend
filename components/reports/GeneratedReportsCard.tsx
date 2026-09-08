"use client";

import type { GeneratedReport, Station } from "@/lib/types";

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
export default function GeneratedReportsCard({
  reports,
  stations,
}: GeneratedReportsCardProps) {
  function stationName(id: string | null) {
    if (id === null) return "All Stations";
    return stations.find((s) => s.id === id)?.name ?? "Unknown station";
  }

  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 md:p-6 pb-2">
        <h2 className="text-sm font-semibold text-gray-200 mb-1">
          Generated Reports
        </h2>
        <p className="text-xs text-gray-400">
          Files produced by your scheduled reports.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-400">
                File
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">
                Station
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">
                Generated
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">
                Format
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">
                  No reports generated yet.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{report.fileName}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {stationName(report.stationId)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 data-value">
                    {new Date(report.generatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right uppercase text-gray-400 text-xs">
                    {report.format}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`${API_BASE}/reports/generated/${report.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
