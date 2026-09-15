"use client";

import { useState } from "react";
import type { Station } from "@/lib/types";
import { DEFAULT_CALIBRATION, type CalibrationOffsets } from "@/lib/calibration";

export default function CalibrationDrawer({
  station,
  current,
  onSave,
  onClose,
}: {
  station: Station;
  current: CalibrationOffsets;
  onSave: (stationId: string, offsets: CalibrationOffsets) => void;
  onClose: () => void;
}) {
  const [baro, setBaro] = useState(String(current.baroOffsetHpa));
  const [temp, setTemp] = useState(String(current.tempOffsetC));

  function handleSave() {
    onSave(station.id, {
      baroOffsetHpa: Number(baro) || 0,
      tempOffsetC: Number(temp) || 0,
    });
    onClose();
  }

  function handleReset() {
    setBaro(String(DEFAULT_CALIBRATION.baroOffsetHpa));
    setTemp(String(DEFAULT_CALIBRATION.tempOffsetC));
  }

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <button
        type="button"
        aria-label="Close calibration panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm h-full bg-card-bg border-l border-border-line shadow-2xl flex flex-col">
        <div className="p-5 border-b border-border-line flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">tune</span>
              Calibrate Sensor Offsets
            </h2>
            <p className="text-xs font-mono text-on-surface-variant mt-1">{station.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-white transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Offsets are added to this station&apos;s raw sensor readings to correct for
            known calibration drift. Positive values increase the reading.
          </p>

          <label className="block">
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
              Barometric Pressure Offset (hPa)
            </span>
            <input
              type="number"
              step="0.01"
              value={baro}
              onChange={(e) => setBaro(e.target.value)}
              className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block">
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
              Air Temperature Offset (°C)
            </span>
            <input
              type="number"
              step="0.01"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-on-surface-variant hover:text-white underline underline-offset-2"
          >
            Reset to 0.00 / 0.00
          </button>
        </div>

        <div className="p-5 border-t border-border-line flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors"
          >
            Save Offsets
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-border-line text-slate-300 hover:bg-slate-800/50 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}