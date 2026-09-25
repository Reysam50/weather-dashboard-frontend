"use client";

import { useState } from "react";
import type { User, Station } from "@/lib/types";
import SearchableToggleList from "@/components/dashboard/SearchableToggleList";

/**
 * "Configure Station Scope" used to open the exact same modal as "Edit"
 * (full name/email/role form) — this is the real, separate control it
 * should have been: only station assignment, nothing else. Administrator
 * and Technical Team have network-wide access per stakeholder-analysis.md
 * (no per-station scope to configure), so this shows an explainer instead
 * of an edit list for those roles rather than a form with nothing
 * meaningful to change.
 */
export default function StationScopeModal({
  user,
  stations,
  onSave,
  onClose,
  isSaving = false,
  error = null,
}: {
  user: User;
  stations: Station[];
  onSave: (userId: string, stationIds: string[]) => void;
  onClose: () => void;
  isSaving?: boolean;
  error?: string | null;
}) {
  const [stationIds, setStationIds] = useState<string[]>(user.stationIds);
  const isScopable = user.role === "station_operator";

  function toggleStation(id: string) {
    setStationIds((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]));
  }

  function handleSave() {
    onSave(user.id, stationIds);
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md bg-card-bg border border-border-hover rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-border-line flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
              Configure Station Scope
            </h2>
            <p className="text-xs font-mono text-on-surface-variant mt-1">
              {user.name} — {user.email}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/25 text-error text-xs font-mono">
              {error}
            </div>
          )}
          {isScopable ? (
            <SearchableToggleList
              title="Stations"
              items={stations.map((s) => ({ id: s.id, label: s.name }))}
              selectedIds={stationIds}
              onToggle={toggleStation}
              searchPlaceholder="Search stations..."
            />
          ) : (
            <div className="p-4 rounded-xl bg-[#080c14] border border-border-line text-sm text-on-surface-variant flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">info</span>
              <span>
                {user.name} has network-wide access as {user.role === "technical_team" ? "Technical Team" : "an Administrator"} — there&apos;s
                no per-station scope to configure for this role.
              </span>
            </div>
          )}
        </div>

        {isScopable && (
          <div className="p-5 border-t border-border-line flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving…" : "Save Scope"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border-line text-slate-300 hover:bg-slate-800/50 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}