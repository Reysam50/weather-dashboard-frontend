"use client";

import type { Station } from "@/lib/types";

export const MAX_COMPARE_STATIONS = 4;

export default function AddStationModal({
  allStations,
  selectedIds,
  onToggle,
  onClose,
}: {
  allStations: Station[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const atLimit = selectedIds.length >= MAX_COMPARE_STATIONS;

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
              <span className="material-symbols-outlined text-primary-container text-[20px]">add_circle</span>
              Add Station to Comparison
            </h2>
            <p className="text-xs font-mono text-on-surface-variant mt-1">
              Up to {MAX_COMPARE_STATIONS} stations at once ({selectedIds.length}/{MAX_COMPARE_STATIONS} selected).
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {allStations.map((station) => {
            const checked = selectedIds.includes(station.id);
            const disabled = !checked && atLimit;
            return (
              <label
                key={station.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  checked
                    ? "bg-card-bg-subtle border-cyan-500/30"
                    : disabled
                    ? "bg-[#080c14] border-transparent opacity-40 cursor-not-allowed"
                    : "bg-[#080c14] border-transparent hover:bg-card-bg-subtle cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggle(station.id)}
                    className="accent-cyan-400"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{station.name}</span>
                    <span className="text-[11px] font-mono text-on-surface-variant">
                      {station.status === "online" ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="p-5 border-t border-border-line">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}