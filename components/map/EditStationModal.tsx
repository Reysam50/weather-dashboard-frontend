"use client";

import { useEffect, useState } from "react";
import type { Station } from "@/lib/types";

export interface EditStationInput {
  name: string;
  particleDeviceId: string;
  latitude: number;
  longitude: number;
}

/**
 * Edit an existing station's name, paired device ID, and coordinates —
 * the map previously only supported placing a *new* station (Provision)
 * with no way to fix a mis-placed pin or correct a typo'd device ID
 * afterwards. Mirrors ProvisionStationModal's location/re-pick UI so the
 * two feel consistent, minus the first-time sensor bus diagnostic (the
 * station's already provisioned and reporting).
 */
export default function EditStationModal({
  station,
  pendingCoords,
  onRepickLocation,
  onSave,
  onClose,
  isSaving = false,
  error = null,
}: {
  station: Station;
  /** Set while the user is mid re-pick — overrides the station's stored
   * coordinates in the form until saved. */
  pendingCoords?: { lat: number; lng: number } | null;
  onRepickLocation: () => void;
  onSave: (id: string, input: EditStationInput) => void;
  onClose: () => void;
  isSaving?: boolean;
  error?: string | null;
}) {
  const [name, setName] = useState(station.name);
  const [particleDeviceId, setParticleDeviceId] = useState(station.particleDeviceId);
  const [latitude, setLatitude] = useState(String(pendingCoords?.lat ?? station.latitude));
  const [longitude, setLongitude] = useState(String(pendingCoords?.lng ?? station.longitude));

  // A re-pick lands asynchronously (user closes this modal, clicks the
  // map, then this modal reopens with new pendingCoords) — sync the
  // coordinate inputs whenever that happens rather than only reading it
  // once at mount.
  useEffect(() => {
    if (pendingCoords) {
      setLatitude(String(pendingCoords.lat));
      setLongitude(String(pendingCoords.lng));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCoords?.lat, pendingCoords?.lng]);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const canSave =
    name.trim().length > 0 &&
    particleDeviceId.trim().length > 0 &&
    latitude.trim().length > 0 &&
    longitude.trim().length > 0 &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng);

  function handleSave() {
    if (!canSave) return;
    onSave(station.id, {
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
        aria-label="Close edit station modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md bg-card-bg border border-border-hover rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-border-line flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">edit_location_alt</span>
              Edit Station
            </h2>
            <p className="text-xs font-mono text-on-surface-variant mt-1">
              Update {station.name}&apos;s record, including its coordinates.
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
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">Station Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block">
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
              Particle Device ID (coreid)
            </span>
            <input
              type="text"
              value={particleDeviceId}
              onChange={(e) => setParticleDeviceId(e.target.value)}
              className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </label>

          <div className="p-3 rounded-lg bg-[#080c14] border border-border-line space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary-container">pin_drop</span>
                Location
              </span>
              <button
                type="button"
                onClick={onRepickLocation}
                className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-card-bg-subtle border border-border-line text-primary-container hover:bg-slate-700 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">map</span>
                Re-pick on Map
              </button>
            </div>
            <p className="text-[10px] text-on-surface-variant -mt-1">
              Click &quot;Re-pick on Map&quot; then click the new spot, or fine-tune the coordinates directly below.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">Latitude</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full bg-card-bg border border-border-line rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">Longitude</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full bg-card-bg border border-border-line rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="px-5">
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/25 text-error text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border-line flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="flex-1 py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save Changes"}
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