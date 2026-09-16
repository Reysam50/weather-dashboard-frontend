"use client";

import { useState } from "react";
import type { Station, ReportSchedule, ReportFrequency, ReportFormat } from "@/lib/types";
import StationScopeSelect from "./StationScopeSelect";
import { FORMAT_STYLES, recurrenceLabel, nextRunLabel } from "@/lib/reportsDisplay";

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
    <div className="bg-card-bg rounded-2xl p-5 border border-border-line shadow-md h-full flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Scheduled Automated Reports</h2>
            <p className="text-xs text-on-surface-variant">Recurring telemetry compilations, delivered as downloadable files (no email in v1).</p>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[#080c14] border border-border-line">
        <p className="font-mono text-[11px] text-on-surface-variant uppercase mb-2">Define New Report Recurrence</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-xs">
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
            className="bg-[#0e1320] border border-border-line rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="daily">Daily at 08:00</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>

          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormat)}
            className="bg-[#0e1320] border border-border-line rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="csv">Format: CSV</option>
            <option value="xls">Format: XLS</option>
            <option value="xlsx">Format: XLSX</option>
            <option value="pdf">Format: PDF</option>
          </select>

          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary-container hover:bg-primary text-slate-950 font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Schedule
          </button>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 font-mono text-[11px] text-on-surface-variant uppercase">
          <span>Active Recurring Pipelines</span>
          <span className="text-primary-container font-semibold">{schedules.length} DAEMONS RUNNING</span>
        </div>
        {schedules.length === 0 ? (
          <p className="py-4 text-sm text-on-surface-variant text-center">No scheduled reports yet.</p>
        ) : (
          <div className="divide-y divide-border-line border-t border-border-line font-mono text-xs">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{stationName(schedule.stationId)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${FORMAT_STYLES[schedule.format]}`}>
                      {schedule.format}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {recurrenceLabel(schedule.frequency)} • {schedule.createdBy}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-on-surface-variant">NEXT RUN</div>
                    <div className="text-primary-container font-semibold">{nextRunLabel(schedule.frequency)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSchedule(schedule.id)}
                    className="px-2.5 py-1 rounded bg-error/10 hover:bg-error/20 text-error font-semibold transition-colors"
                  >
                    Terminate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#080c14] border border-border-line text-[11px] font-mono text-on-surface-variant">
        <span className="material-symbols-outlined text-[14px] text-primary-container flex-shrink-0">info</span>
        <span>Delivery note: reports write to the server&apos;s report storage with zero write blocking.</span>
      </div>
    </div>
  );
}