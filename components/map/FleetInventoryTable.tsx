"use client";

import { useState } from "react";
import type { Station } from "@/lib/types";
import { getStationHardware } from "@/lib/stationHardware";
import { formatTimeAgoPrecise } from "@/lib/formatTimeAgo";
import { useHydrated } from "@/lib/useHydrated";
import type { CalibrationOffsets } from "@/lib/calibration";

export default function FleetInventoryTable({
  stations,
  calibrationOverrides,
  canManage,
  onCalibrate,
  onExportCsv,
  onSyncFleet,
}: {
  stations: Station[];
  calibrationOverrides: Record<string, CalibrationOffsets>;
  canManage: boolean;
  onCalibrate: (station: Station) => void;
  onExportCsv: () => void;
  onSyncFleet: () => void;
}) {
  const hydrated = useHydrated();
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<Record<string, number>>({});
  const [syncing, setSyncing] = useState(false);

  function handlePing(stationId: string) {
    setPingingId(stationId);
    const latency = 22 + Math.round(Math.random() * 40);
    setTimeout(() => {
      setPingResult((prev) => ({ ...prev, [stationId]: latency }));
      setPingingId(null);
    }, 700);
  }

  function handleSync() {
    setSyncing(true);
    onSyncFleet();
    setTimeout(() => setSyncing(false), 1200);
  }

  return (
    <section className="w-full bg-card-bg rounded-2xl p-5 border border-border-line shadow-lg space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border-line">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[22px]">
              developer_board
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Automatic Weather Station Fleet Inventory
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-container/15 border border-primary-container/30 font-mono text-[11px] text-primary-container font-bold">
              {stations.length} PROVISIONED
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={onExportCsv}
            className="px-3 py-1.5 rounded-lg bg-card-bg-subtle text-on-surface-variant hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors border border-border-line"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleSync}
            className="px-3 py-1.5 rounded-lg bg-card-bg-subtle text-on-surface-variant hover:text-primary-container font-mono text-xs flex items-center gap-1.5 transition-colors border border-border-line"
          >
            <span className={`material-symbols-outlined text-[16px] ${syncing ? "animate-spin" : ""}`}>
              sync
            </span>
            <span>{syncing ? "Syncing…" : "Sync Fleet (60s)"}</span>
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg bg-[#080c14] border border-border-line">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-card-bg-subtle text-on-surface-variant font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Station &amp; Geolocation</th>
              <th className="py-3 px-4">Hardware Device ID</th>
              <th className="py-3 px-4">Firmware</th>
              <th className="py-3 px-4">Status &amp; Ingest</th>
              <th className="py-3 px-4">Sensor Suite &amp; Health</th>
              <th className="py-3 px-4">Calibration / Offsets</th>
              <th className="py-3 px-4 text-right">Hardware Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-line font-mono text-xs text-slate-300">
            {stations.map((station) => {
              const hw = getStationHardware(station.id);
              const offline = station.status === "offline";
              const calib = calibrationOverrides[station.id];

              return (
                <tr
                  key={station.id}
                  className={`hover:bg-slate-800/30 transition-colors group ${
                    offline ? "bg-error/5" : ""
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          offline ? "bg-error animate-pulse" : "bg-primary-container"
                        }`}
                      />
                      <div>
                        <span
                          className={`font-bold block ${
                            offline ? "text-error" : "text-white group-hover:text-primary-container"
                          } transition-colors`}
                        >
                          {station.name}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {hw.geolocationLabel} ({station.latitude.toFixed(4)}°,{" "}
                          {station.longitude.toFixed(4)}°)
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-line w-fit ${
                        offline ? "text-error" : "text-primary-container"
                      } bg-card-bg-subtle`}
                    >
                      <span className="material-symbols-outlined text-[14px]">fingerprint</span>
                      <span className="truncate max-w-[180px]">{station.particleDeviceId}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-semibold border border-border-line ${
                          hw.firmwareUpToDate ? "text-white bg-card-bg-subtle" : "text-secondary bg-card-bg-subtle"
                        }`}
                      >
                        {hw.firmware}
                      </span>
                      <span
                        className={`material-symbols-outlined text-[14px] ${
                          hw.firmwareUpToDate ? "text-primary-container" : "text-secondary"
                        }`}
                        title={hw.firmwareUpToDate ? "Firmware up to date" : "Pending OTA update"}
                      >
                        {hw.firmwareUpToDate ? "check_circle" : "system_update_alt"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          offline ? "text-error" : "text-primary-container"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            offline ? "bg-error" : "bg-primary-container animate-ping"
                          }`}
                        />
                        {offline ? "OFFLINE" : "ONLINE"} ({hydrated ? formatTimeAgoPrecise(station.lastSeenAt) : "…"})
                      </span>
                      <span className={`text-[11px] ${offline ? "text-error" : "text-on-surface-variant"}`}>
                        {hw.ingestMethod}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center gap-1">
                      {hw.sensorSuite.map((s) => (
                        <span
                          key={s.label}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-medium border border-border-line bg-card-bg-subtle ${
                            s.healthy ? "text-primary-container" : "text-error"
                          }`}
                        >
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-on-surface-variant">
                    <span className="block">Baro: {formatOffset(calib?.baroOffsetHpa ?? 0)} hPa</span>
                    <span className="block">Temp: {formatOffset(calib?.tempOffsetC ?? 0)} °C</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {offline ? (
                        <button
                          type="button"
                          onClick={() => handlePing(station.id)}
                          className="px-2.5 py-1 rounded-md bg-error/20 hover:bg-error/30 text-error font-bold text-[11px] transition-colors flex items-center gap-1 border border-error/40"
                        >
                          <span className="material-symbols-outlined text-[14px]">cell_tower</span>
                          <span>
                            {pingingId === station.id
                              ? "Waking…"
                              : pingResult[station.id]
                              ? `${pingResult[station.id]}ms`
                              : "Wake Request"}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePing(station.id)}
                          className="px-2.5 py-1 rounded-md bg-card-bg-subtle hover:bg-slate-700 text-on-surface-variant hover:text-white text-[11px] transition-colors flex items-center gap-1 border border-border-line"
                        >
                          <span className="material-symbols-outlined text-[14px]">wifi_tethering</span>
                          <span>
                            {pingingId === station.id
                              ? "Pinging…"
                              : pingResult[station.id]
                              ? `${pingResult[station.id]}ms`
                              : "Ping"}
                          </span>
                        </button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onCalibrate(station)}
                          className="px-2.5 py-1 rounded-md bg-card-bg-subtle hover:bg-slate-700 text-on-surface-variant hover:text-primary-container text-[11px] transition-colors flex items-center gap-1 border border-border-line"
                        >
                          <span className="material-symbols-outlined text-[14px]">tune</span>
                          <span>Calibrate</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 rounded-lg bg-[#080c14] border border-border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-[11px] text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[16px]">admin_panel_settings</span>
          <span>
            ACCESS POLICY: {canManage
              ? "Technical Team has full write access (calibration offsets, hardware pings)."
              : "Administrators have read-only access to fleet analytics."}
          </span>
        </div>
      </div>
    </section>
  );
}

function formatOffset(value: number) {
  if (value === 0) return "+0.00";
  return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}