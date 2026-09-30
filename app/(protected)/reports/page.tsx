"use client";

import QuickExportCard from "@/components/reports/QuickExportCard";
import ScheduleReportCard from "@/components/reports/ScheduleReportCard";
import GeneratedReportsCard from "@/components/reports/GeneratedReportsCard";
import ManualRecoveryUploadCard from "@/components/reports/ManualRecoveryUploadCard";
import ReportsLoading from "./loading";
import { useStationContext } from "@/lib/StationContext";
import { useReports } from "@/lib/useReports";
import { useAuth } from "@/lib/AuthContext";

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
 * Data comes from lib/useReports.ts (GET/POST/DELETE /reports/schedules,
 * GET /reports/generated); the station list comes from StationContext.
 */
export default function ReportsPage() {
  const { user } = useAuth();
  const allowAllStations = user.role !== "station_operator";
  const canRecoverData = user.role === "technical_team";
  const { stations } = useStationContext();
  const { schedules, generated, status, errorMessage, actionError, createSchedule, deleteSchedule, refetch } =
    useReports();
  const defaultStationId =
    user.role === "station_operator" && user.stations !== "all" && user.stations.length > 0
      ? user.stations[0]
      : stations[0]?.id ?? "";

  if (status === "loading") return <ReportsLoading />;

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="material-symbols-outlined text-[36px] text-rose-400">cloud_off</span>
        <p className="text-white font-semibold">Couldn&apos;t load reports</p>
        <p className="text-sm text-slate-400 max-w-sm">{errorMessage}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-2 px-4 py-2 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
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

      {actionError && (
        <div className="px-4 py-2.5 rounded-xl bg-error/10 border border-error/25 text-error text-xs font-mono">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-1">
          <QuickExportCard stations={stations} defaultStationId={defaultStationId} />
        </div>
        <div className="lg:col-span-2">
          <ScheduleReportCard
            stations={stations}
            schedules={schedules}
            allowAllStations={allowAllStations}
            defaultStationId={defaultStationId}
            onCreateSchedule={createSchedule}
            onDeleteSchedule={deleteSchedule}
          />
        </div>
      </div>

      <GeneratedReportsCard reports={generated} stations={stations} />

      {canRecoverData && <ManualRecoveryUploadCard stations={stations} />}
    </div>
  );
}