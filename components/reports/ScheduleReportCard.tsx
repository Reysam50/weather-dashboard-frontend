"use client";

import { useState } from "react";
import type { Station, ReportSchedule, ReportFrequency, ReportFormat } from "@/lib/types";
import StationScopeSelect from "./StationScopeSelect";

interface ScheduleReportCardProps {
  stations: Station[];
  schedules: ReportSchedule[];
  allowAllStations: boolean;
  defaultStationId: string;
  onCreateSchedule: (input: {
    stationId: string | null;
    frequency: ReportFrequency;
    format: ReportFormat;
  }) => void;
  onDeleteSchedule: (id: string) => void;
}

/**
 * Scheduled report configuration — FR-9.1/9.2. Per api-specification.md §6,
 * creating a schedule with stationId: null (All Stations) is
 * Administrator/Technical Team only; a Station Operator's schedules are
 * always scoped to their one assigned station — enforced here by the page
 * passing allowAllStations=false and a locked defaultStationId for that role.
 */
export default function ScheduleReportCard({
  stations,
  schedules,
  allowAllStations,
  defaultStationId,
  onCreateSchedule,
  onDeleteSchedule,
}: ScheduleReportCardProps) {
  const [stationId, setStationId] = useState<string | null>(defaultStationId);
  const [frequency, setFrequency] = useState<ReportFrequency>("daily");
  const [format, setFormat] = useState<ReportFormat>("csv");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreateSchedule({ stationId, frequency, format });
  }

  function stationName(id: string | null) {
    if (id === null) return "All Stations";
    return stations.find((s) => s.id === id)?.name ?? "Unknown station";
  }

  return (
    <div className="bg-weather-card rounded-2xl p-4 md:p-6 border border-white/10 h-full">
      <h2 className="text-sm font-semibold text-gray-200 mb-1">Scheduled Reports</h2>
      <p className="text-xs text-gray-400 mb-4">
        Generated automatically — download or view them below once ready.
        No email delivery in v1 (FR-9.2).
      </p>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5"
      >
        <StationScopeSelect
          stations={stations}
          value={stationId}
          onChange={setStationId}
          allowAllStations={allowAllStations}
          disabled={!allowAllStations && stations.length <= 1}
        />

        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as ReportFrequency)}
          className="input-dark px-3 py-2 rounded-lg text-sm text-white"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>

        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as ReportFormat)}
          className="input-dark px-3 py-2 rounded-lg text-sm text-white"
        >
          <option value="csv">CSV</option>
          <option value="xls">XLS</option>
          <option value="xlsx">XLSX</option>
        </select>

        <button
          type="submit"
          className="btn-primary py-2 rounded-lg text-sm font-medium"
        >
          + Add Schedule
        </button>
      </form>

      <div className="divide-y divide-white/5 border-t border-white/10">
        {schedules.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">No scheduled reports yet.</p>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <div>
                <span className="font-medium">{stationName(schedule.stationId)}</span>
                <span className="text-gray-400">
                  {" "}
                  — {schedule.frequency}, {schedule.format.toUpperCase()}
                </span>
                <p className="text-xs text-gray-500">Created by {schedule.createdBy}</p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteSchedule(schedule.id)}
                className="text-gray-500 hover:text-red-400 transition-colors text-xs"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}