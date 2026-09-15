"use client";

import { useState } from "react";

interface NewStationInput {
  name: string;
  particleDeviceId: string;
  latitude: number;
  longitude: number;
}

const SENSOR_CHECKS = ["SHT31 [Air/Humidity]", "BMP280 [Barometric]", "Dual Rain Gauge Bus"];

export default function ProvisionStationModal({
  onSave,
  onClose,
}: {
  onSave: (station: NewStationInput) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [particleDeviceId, setParticleDeviceId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [testState, setTestState] = useState<"idle" | "running" | "done">("idle");
  const [checkedCount, setCheckedCount] = useState(0);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const canSave =
    name.trim().length > 0 &&
    particleDeviceId.trim().length > 0 &&
    latitude.trim().length > 0 &&
    longitude.trim().length > 0 &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng);

  function runSensorBusTest() {
    if (!particleDeviceId.trim()) return;
    setTestState("running");
    setCheckedCount(0);
    SENSOR_CHECKS.forEach((_, i) => {
      setTimeout(() => {
        setCheckedCount(i + 1);
        if (i === SENSOR_CHECKS.length - 1) setTestState("done");
      }, (i + 1) * 500);
    });
  }

  function handleSave() {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      particleDeviceId: particleDeviceId.trim(),
      latitude: lat,
      longitude: lng,
    });
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close provisioning modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md bg-card-bg border border-border-hover rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-border-line flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                add_circle
              </span>
              Provision New AWS Station
            </h2>
            <p className="text-xs font-mono text-on-surface-variant mt-1">
              Pair a Particle Boron device ID with a new station record.
            </p>
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

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <label className="block">
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
              Station Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Namiwawa Compound"
              className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block">
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
              Particle Device ID (coreid)
            </span>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={particleDeviceId}
                onChange={(e) => setParticleDeviceId(e.target.value)}
                placeholder="e.g. 3a0021000747343232363230"
                className="flex-1 min-w-0 bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                title="Barcode scanning needs camera/hardware integration — not available in this mock UI yet"
                disabled
                className="px-3 rounded-lg border border-border-line text-on-surface-variant opacity-50 cursor-not-allowed flex items-center"
              >
                <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
              </button>
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
                Latitude
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="-15.3860"
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
                Longitude
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="35.3182"
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </label>
          </div>

          <div className="p-3 rounded-lg bg-[#080c14] border border-border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-300">
                Sensor Bus Diagnostic
              </span>
              <button
                type="button"
                onClick={runSensorBusTest}
                disabled={!particleDeviceId.trim() || testState === "running"}
                className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-card-bg-subtle border border-border-line text-primary-container hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {testState === "running" ? "Testing…" : "Run Test"}
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {SENSOR_CHECKS.map((label, i) => {
                const checked = checkedCount > i;
                return (
                  <li key={label} className="flex items-center gap-2 text-[11px] font-mono">
                    <span
                      className={`material-symbols-outlined text-[15px] ${
                        checked ? "text-success" : "text-slate-600"
                      }`}
                    >
                      {checked ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span className={checked ? "text-slate-200" : "text-slate-500"}>{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="p-5 border-t border-border-line flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Provision Station
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