"use client";

import { useState } from "react";

interface AddStationFormProps {
  pendingLocation: { lat: number; lng: number } | null;
  onCancel: () => void;
  onSave: (station: {
    name: string;
    particleDeviceId: string;
    latitude: number;
    longitude: number;
  }) => void;
}

/**
 * "Add Station" panel — Technical Team only (FR-12.3/FR-12.4). This is the
 * station-provisioning step: pairing a physical Particle Boron's device ID
 * (the "coreid" from the hardware doc) with a brand-new station record.
 *
 * Location comes from clicking a spot on the map first, rather than typing
 * raw latitude/longitude by hand — picking a point visually is far less
 * error-prone than hand-entering coordinates. See the page component for
 * how a map click gets routed here as `pendingLocation`.
 */
export default function AddStationForm({
  pendingLocation,
  onCancel,
  onSave,
}: AddStationFormProps) {
  const [name, setName] = useState("");
  const [particleDeviceId, setParticleDeviceId] = useState("");

  const canSave =
    name.trim().length > 0 &&
    particleDeviceId.trim().length > 0 &&
    pendingLocation !== null;

  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 p-4">
      <h2 className="text-sm font-semibold mb-3">Add Station</h2>

      {!pendingLocation ? (
        <p className="text-sm text-gray-400">
          Click a location on the map to place the new station.
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3 data-value">
            Location: {pendingLocation.lat.toFixed(5)}, {pendingLocation.lng.toFixed(5)}
          </p>

          <label className="block text-xs text-gray-400 mb-1">
            Station name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Zomba Plateau"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-weather-accent"
          />

          <label className="block text-xs text-gray-400 mb-1">
            Particle device ID (coreid)
          </label>
          <input
            type="text"
            value={particleDeviceId}
            onChange={(e) => setParticleDeviceId(e.target.value)}
            placeholder="e.g. 3a0021000747343232363230"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-weather-accent"
          />

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canSave}
              onClick={() =>
                pendingLocation &&
                onSave({
                  name: name.trim(),
                  particleDeviceId: particleDeviceId.trim(),
                  latitude: pendingLocation.lat,
                  longitude: pendingLocation.lng,
                })
              }
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg py-2 text-sm font-medium"
            >
              Save Station
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}