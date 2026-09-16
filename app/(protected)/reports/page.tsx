"use client";

import { useState } from "react";
import QuickExportCard from "@/components/reports/QuickExportCard";
import ScheduleReportCard from "@/components/reports/ScheduleReportCard";
import GeneratedReportsCard from "@/components/reports/GeneratedReportsCard";
import ManualRecoveryUploadCard from "@/components/reports/ManualRecoveryUploadCard";
import { mockStations } from "@/lib/mockStations";
import { mockSchedules, mockGeneratedReports } from "@/lib/mockReports";
import { CURRENT_ROLE, ASSIGNED_STATION_ID } from "@/lib/mockAuth";
import type { ReportSchedule } from "@/lib/types";

/**
 * Reports screen — FR-8 (ad-hoc data export) + FR-9 (scheduled report
 * generation) + FR-11.3 (manual data recovery upload), per
 * api-specification.md §5–6. Rebuilt to match
 * data_export_automated_reporting_redesigned.
 *
 * Role scoping (CONFIRMED in the API spec):
 * - Station Operator: every form here is locked to their one assigned
 *   station — "All Stations" never appears as an option.
 * - Administrator / Technical Team: can create All-Stations schedules and
 *   see everyone's schedules/generated reports, not just their own.
 *
 * Manual Data Recovery is Technical-Team-only (see
 * ManualRecoveryUploadCard.tsx's comment on why that's inferred rather
 * than explicitly confirmed in the spec).
 *
 * TODO (frontend developer):
 * - replace mockSchedules/mockGeneratedReports with real fetches to
 *   GET /reports/schedules and GET /reports/generated
 * - wire handleCreateSchedule to POST /reports/schedules and
 *   handleDeleteSchedule to DELETE /reports/schedules/{id}
 */
export default function ReportsPage() {
  const allowAllStations = CURRENT_ROLE !== "station_operator";
  const canRecoverData = CURRENT_ROLE === "technical_team";
  const defaultStationId =
    CURRENT_ROLE === "station_operator" ? ASSIGNED_STATION_ID : mockStations[0]?.id ?? "1";

  const [schedules, setSchedules] = useState<ReportSchedule[]>(mockSchedules);

  function handleCreateSchedule(input: {
    stationId: string | null;
    frequency: ReportSchedule["frequency"];
    format: ReportSchedule["format"];
  }) {
    // TODO: POST to /reports/schedules — this just appends locally so the
    // flow is testable end-to-end in the meantime.
    setSchedules((prev) => [...prev, { id: crypto.randomUUID(), createdBy: "You", ...input }]);
  }

  function handleDeleteSchedule(id: string) {
    // TODO: DELETE /reports/schedules/{id}
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* HUD strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 rounded-2xl bg-card-bg border border-border-line font-mono text-xs">
        <span className="flex items-center gap-1.5 text-primary-container font-semibold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px]">dns</span>
          Telemetry Ingest / Archival Pipeline
        </span>
        <div className="flex items-center gap-4 text-on-surface-variant">
          <span>
            STORAGE ROOT: <strong className="text-white">/var/data/reports/</strong>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            BACKFILL BUFFER: 100% READY (0 LOSS)
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">Data Export &amp; Automated Reporting</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-primary-container/15 border border-primary-container/30 text-primary-container font-mono text-[11px] font-bold">
            ZERO LOSS DEDUPLICATION
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-1">
          <QuickExportCard stations={mockStations} defaultStationId={defaultStationId} />
        </div>
        <div className="lg:col-span-2">
          <ScheduleReportCard
            stations={mockStations}
            schedules={schedules}
            allowAllStations={allowAllStations}
            defaultStationId={defaultStationId}
            onCreateSchedule={handleCreateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        </div>
      </div>

      <GeneratedReportsCard reports={mockGeneratedReports} stations={mockStations} />

      {canRecoverData && <ManualRecoveryUploadCard stations={mockStations} />}
    </div>
  );
}