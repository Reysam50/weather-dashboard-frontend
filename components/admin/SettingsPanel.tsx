"use client";

import type { AdminSettings } from "@/lib/adminSettings";
import { mockStations } from "@/lib/mockStations";

interface SettingsPanelProps {
  draft: AdminSettings;
  onChange: (patch: Partial<AdminSettings>) => void;
}

const POLLING_OPTIONS: { value: AdminSettings["pollingIntervalSec"]; label: string; note: string; tag: string }[] = [
  {
    value: 30,
    label: "30 Seconds (High Density)",
    note: "Increased battery draw. Recommended during severe storm events.",
    tag: "STORM OPS",
  },
  {
    value: 60,
    label: "60 Seconds (Recommended)",
    note: "Optimal balance of cellular bandwidth, battery, and telemetry cadence.",
    tag: "NOMINAL",
  },
  {
    value: 300,
    label: "5 Minutes (Eco Saver)",
    note: "Minimal solar charge mode during extended monsoon cloud cover.",
    tag: "LOW POWER",
  },
];

/**
 * System & Map Preferences tab. Basemap theme is genuinely wired — it's
 * the same lib/adminSettings.ts the Station Map screen reads on mount
 * (see app/(protected)/stations/page.tsx). Polling interval also feeds
 * the header's SseLatencyBadge label. The resilience toggles below are
 * firmware-level behavior with no in-browser effect yet; they're stored
 * for real (not just decorative) but honestly can't simulate a field
 * device from here.
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Basemap theme */}
        <div className="bg-card-bg p-4 rounded-2xl border border-border-line shadow-sm flex flex-col gap-4">
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

        {/* Polling frequency */}
        <div className="bg-card-bg p-4 rounded-2xl border border-border-line shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">sync</span>
            <h2 className="text-sm font-bold text-white">Ingest &amp; Polling Frequency</h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            Global SSE heartbeat interval — also shown in the header&apos;s connection badge.
          </p>
          <div className="flex flex-col gap-2.5">
            {POLLING_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                  draft.pollingIntervalSec === opt.value ? "bg-card-bg-subtle border border-amber-500/30" : "bg-[#080c14] hover:bg-card-bg-subtle border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="polling"
                    checked={draft.pollingIntervalSec === opt.value}
                    onChange={() => onChange({ pollingIntervalSec: opt.value })}
                    className="accent-amber-400"
                  />
                  <div>
                    <div className={`text-xs font-mono font-semibold ${draft.pollingIntervalSec === opt.value ? "text-secondary" : "text-white"}`}>
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-on-surface-variant font-mono">{opt.note}</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-on-surface-variant">{opt.tag}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Resilience toggles */}
        <div className="bg-card-bg p-4 rounded-2xl border border-border-line shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary-container">cell_tower</span>
            <h2 className="text-sm font-bold text-white">Data Transmission Resilience</h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            Field-firmware behavior during cellular loss — stored here, applied on next OTA push (not simulated live in-browser).
          </p>
          <div className="flex flex-col gap-3">
            <ToggleRow
              label="Fallback Telemetry Model"
              note="Synthetic interpolation during cellular blackouts"
              checked={draft.fallbackTelemetryEnabled}
              onChange={(v) => onChange({ fallbackTelemetryEnabled: v })}
            />
            <ToggleRow
              label="SD Card Backpressure Ingest"
              note="Auto-sync buffered offline flash logs on reconnection"
              checked={draft.sdBackpressureEnabled}
              onChange={(v) => onChange({ sdBackpressureEnabled: v })}
            />
            <ToggleRow
              label="Dual-Pipe mTLS Verification"
              note="Reject packets failing cryptographic hardware signatures"
              checked={draft.mtlsEnabled}
              onChange={(v) => onChange({ mtlsEnabled: v })}
            />
          </div>
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

function ToggleRow({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#080c14]">
      <div>
        <div className="text-xs font-mono font-semibold text-white">{label}</div>
        <div className="text-[10px] text-on-surface-variant font-mono">{note}</div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container" />
      </label>
    </div>
  );
}