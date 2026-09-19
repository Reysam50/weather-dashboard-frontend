"use client";

import type { StationMockData } from "@/lib/mockStationData";
import { computeSensorAgreement } from "@/lib/liveTelemetryData";
import { useAdminSettings } from "@/lib/AdminSettingsContext";

/**
 * Sensor agreement panel — MCP9808 is the primary air-temp sensor; BMP360
 * and SHT31 are diagnostic cross-checks, shown as their delta from the
 * primary rather than as three equal inputs to a weighted median (which
 * is what this card used to compute and show as "the" temperature — that
 * implied one composite reading nobody's sensor actually reports, and
 * buried which sensor is actually driving the rest of the dashboard).
 *
 * The tolerance is a real setting now (Admin → System & Map Preferences →
 * Sensor & QA Tolerances), read live via AdminSettingsContext — this
 * panel updates immediately if that changes, no hardcoded ±0.8°C.
 */
export default function SensorTriadCard({ data }: { data: StationMockData }) {
  const { settings } = useAdminSettings();
  const airTemp = data.current.airTemp;
  const bmpTemp = data.bmpTempHistory[data.bmpTempHistory.length - 1];
  const shtTemp = data.shtTempHistory[data.shtTempHistory.length - 1];

  const agreement = computeSensorAgreement(airTemp, bmpTemp, shtTemp, settings.sensorAgreementToleranceC);
  const isOptimal = agreement.status === "OPTIMAL";

  return (
    <div className="bg-card-bg rounded-2xl p-7 border border-border-line shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between pb-4 border-b border-border-line">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-cyan-400">flaky</span>
          <h3 className="font-bold text-white text-base tracking-tight">SENSOR AGREEMENT</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-card-bg-subtle border border-cyan-500/30 text-cyan-300 font-mono text-[11px]">
          TOLERANCE ±{settings.sensorAgreementToleranceC}°C
        </span>
      </div>

      {/* Primary reading */}
      <div className="mt-5 p-4 rounded-xl bg-[#090d16] border border-cyan-500/20 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono text-cyan-300 font-semibold uppercase tracking-wider">
            Primary — MCP9808
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl font-extrabold text-white font-sans">{airTemp}</span>
            <span className="text-base text-cyan-300 font-mono">°C</span>
          </div>
        </div>
        <span
          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 ${
            isOptimal ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isOptimal ? "check_circle" : "warning"}
          </span>
          {agreement.status}
        </span>
      </div>

      {/* Diagnostic sensors */}
      <div className="grid grid-cols-2 gap-3 my-4 font-mono">
        <div className="p-3 rounded-xl bg-[#090d16] border border-border-line flex flex-col items-center text-center">
          <span className="text-[11px] text-cyan-300 font-semibold">BMP360 (diagnostic)</span>
          <span className="text-xl font-bold text-white my-1">{bmpTemp}°</span>
          <span
            className={`text-[10px] font-semibold ${
              Math.abs(agreement.bmpDeltaC) <= settings.sensorAgreementToleranceC
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            Δ {agreement.bmpDeltaC >= 0 ? "+" : ""}
            {agreement.bmpDeltaC} vs primary
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#090d16] border border-border-line flex flex-col items-center text-center">
          <span className="text-[11px] text-purple-300 font-semibold">SHT31 (diagnostic)</span>
          <span className="text-xl font-bold text-white my-1">{shtTemp}°</span>
          <span
            className={`text-[10px] font-semibold ${
              Math.abs(agreement.shtDeltaC) <= settings.sensorAgreementToleranceC
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            Δ {agreement.shtDeltaC >= 0 ? "+" : ""}
            {agreement.shtDeltaC} vs primary
          </span>
        </div>
      </div>

      {/* Spread / QA summary */}
      <div className="p-4 rounded-xl bg-[#090d16] border border-border-line space-y-1.5 font-mono text-xs">
        <div className="flex justify-between items-center text-slate-400">
          <span>Triad Spread (max − min)</span>
          <span className="text-white font-bold">{agreement.spreadC}°C</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Max Diagnostic Delta</span>
          <span className={`font-bold ${isOptimal ? "text-cyan-300" : "text-rose-400"}`}>
            {agreement.maxAbsDeltaC}°C
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>QA Assessment</span>
          <span
            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              isOptimal ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
            }`}
          >
            {isOptimal ? "SENSORS AGREE" : "CHECK SENSORS"}
          </span>
        </div>
      </div>
    </div>
  );
}