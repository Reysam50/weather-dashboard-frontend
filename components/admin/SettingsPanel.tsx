"use client";

import type { AdminSettings } from "@/lib/adminSettings";
import { mockStations } from "@/lib/mockStations";

interface SettingsPanelProps {
  draft: AdminSettings;
  onChange: (patch: Partial<AdminSettings>) => void;
}

/**
 * System & Map Preferences tab. Basemap theme is genuinely wired — it's
 * the same lib/adminSettings.ts the Station Map screen reads on mount
 * (see app/(protected)/stations/page.tsx).
 *
 * The Ingest & Polling Frequency and Data Transmission Resilience cards
 * that used to live here (a set of polling-interval radio options, plus
 * a Dual-Pipe mTLS Verification toggle) were removed from this UI.
 * pollingIntervalSec itself is left in AdminSettings/DEFAULT_SETTINGS —
 * the header's SseLatencyBadge still reads it — it's just fixed at the
 * default (60s) now that there's no control here to change it.
 */
export default function SettingsPanel({ draft, onChange }: SettingsPanelProps) {
  const regionBounds = mockStations.reduce(
    (acc, s) => ({
      minLat: Math.min(acc.minLat, s.latitude),
      maxLat: Math.max(acc.maxLat, s.latitude),
      minLng: Math.min(acc.minLng, s.longitude),
      maxLng: Math.max(acc.maxLng, s.longitude),
    }),
    { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 }
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Basemap theme */}
      <div className="bg-card-bg p-4 rounded-2xl border border-border-line shadow-sm flex flex-col gap-4 max-w-xl">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary-container">map</span>
          <h2 className="text-sm font-bold text-white">Basemap Display Theme</h2>
        </div>
        <p className="text-xs text-on-surface-variant">
          Default cartographic layer for the Station Management Map — takes effect next time that screen loads.
        </p>
        <div className="flex flex-col gap-2.5">
          <label
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
              draft.mapTheme === "dark" ? "bg-card-bg-subtle border border-cyan-500/30" : "bg-[#080c14] hover:bg-card-bg-subtle border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="basemap"
                checked={draft.mapTheme === "dark"}
                onChange={() => onChange({ mapTheme: "dark" })}
                className="accent-cyan-400"
              />
              <div>
                <div className={`text-xs font-mono font-semibold ${draft.mapTheme === "dark" ? "text-primary-container" : "text-white"}`}>
                  Dark Tactical
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono">
                  High-contrast slate foundation with cyan/amber highlights.
                </div>
              </div>
            </div>
            {draft.mapTheme === "dark" && (
              <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary-container font-mono text-[10px] font-bold">
                ACTIVE
              </span>
            )}
          </label>
          <label
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
              draft.mapTheme === "light" ? "bg-card-bg-subtle border border-cyan-500/30" : "bg-[#080c14] hover:bg-card-bg-subtle border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="basemap"
                checked={draft.mapTheme === "light"}
                onChange={() => onChange({ mapTheme: "light" })}
                className="accent-cyan-400"
              />
              <div>
                <div className={`text-xs font-mono font-semibold ${draft.mapTheme === "light" ? "text-primary-container" : "text-white"}`}>
                  Light Monolith
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono">
                  Calibrated low-reflection theme for daylight control towers.
                </div>
              </div>
            </div>
            {draft.mapTheme === "light" && (
              <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary-container font-mono text-[10px] font-bold">
                ACTIVE
              </span>
            )}
          </label>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#080c14] opacity-60">
            <div>
              <div className="text-xs font-mono font-semibold text-slate-400">Satellite Hybrid</div>
              <div className="text-[10px] text-on-surface-variant font-mono">
                Needs a satellite tile provider — not connected yet.
              </div>
            </div>
            <span className="font-mono text-[10px] text-slate-500">COMING SOON</span>
          </div>
        </div>
      </div>

      {/* Sensor & QA tolerances — previously hardcoded in the dashboard */}
      <div className="bg-card-bg p-4 rounded-2xl border border-border-line shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-secondary">tune</span>
          <h2 className="text-sm font-bold text-white">Sensor &amp; QA Tolerances</h2>
        </div>
        <p className="text-xs text-on-surface-variant">
          Feed the Live Dashboard&apos;s Sensor Agreement panel and dual-gauge rainfall check —
          applies immediately, everywhere, once published.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
              Sensor Agreement Tolerance (°C)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={draft.sensorAgreementToleranceC}
                onChange={(e) =>
                  onChange({ sensorAgreementToleranceC: Math.max(0.1, Number(e.target.value) || 0.1) })
                }
                className="w-24 bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-on-surface-variant font-mono">
                Max BMP360/SHT31 diagnostic delta from the primary MCP9808 reading before it&apos;s
                flagged as degraded.
              </span>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
              Rain Gauge Variance Tolerance (%)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={draft.rainGaugeVarianceTolerancePct}
                onChange={(e) =>
                  onChange({ rainGaugeVarianceTolerancePct: Math.max(0.5, Number(e.target.value) || 0.5) })
                }
                className="w-24 bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-on-surface-variant font-mono">
                Max acceptable difference between the two 451A rain gauges before flagging a
                variance warning.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Real geo-spatial reference, replacing the mockup's stock photo */}
      <div className="bg-card-bg p-4 rounded-2xl border border-border-line shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary-container">public</span>
          <span className="font-mono text-xs text-white font-semibold">
            REGIONAL BOUNDING BOX: {regionBounds.minLat.toFixed(3)}S, {regionBounds.minLng.toFixed(3)}E
            {" → "}
            {Math.abs(regionBounds.maxLat).toFixed(3)}S, {regionBounds.maxLng.toFixed(3)}E
          </span>
        </div>
        <span className="font-mono text-[11px] text-secondary">CALIBRATED COORD SYSTEM: WGS-84 / UTM ZONE 36S</span>
      </div>
    </div>
  );
}