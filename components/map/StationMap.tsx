"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Station } from "@/lib/types";
import { searchLocation } from "@/lib/geocode";
import { formatTimeAgo } from "@/lib/formatTimeAgo";

function statusDivIcon(status: Station["status"], isSelected: boolean) {
  const color = status === "online" ? "#22c55e" : "#ef4444";
  const size = isSelected ? 18 : 14;
  const ring = isSelected ? `0 0 0 4px #3b82f6aa, 0 0 0 8px ${color}33` : `0 0 0 4px ${color}33`;

  return L.divIcon({
    className: "",
    html: `<span style="
      display:block; width:${size}px; height:${size}px; border-radius:9999px;
      background:${color}; border:2px solid rgba(255,255,255,0.9);
      box-shadow:${ring};
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const PENDING_ICON = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#3b82f6;border:2px solid white;"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const SEARCH_RESULT_ICON = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#a78bfa;border:2px solid white;"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface StationMapProps {
  stations: Station[];
  selectedStationId: string | null;
  onSelectStation: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  pendingMarker?: { lat: number; lng: number } | null;
  mapTheme?: "light" | "dark";
  onLocationFound?: (lat: number, lng: number, label: string) => void;
  searchMarker?: { lat: number; lng: number; label: string } | null;
}

function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToStation({ station }: { station: Station | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (!station) return;
    map.flyTo([station.latitude, station.longitude], Math.max(map.getZoom(), 12), {
      duration: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station?.id, station?.latitude, station?.longitude]);

  return null;
}

function LocationSearchOverlay({
  onFound,
}: {
  onFound?: (lat: number, lng: number, label: string) => void;
}) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    L.DomEvent.disableClickPropagation(containerRef.current);
    L.DomEvent.disableScrollPropagation(containerRef.current);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setError(null);
    try {
      const results = await searchLocation(trimmed);
      if (results.length === 0) {
        setError("No results found.");
        return;
      }
      const top = results[0];
      map.flyTo([top.lat, top.lon], 12, { duration: 1 });
      onFound?.(top.lat, top.lon, top.displayName);
    } catch {
      setError("Search failed — try again.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div ref={containerRef} className="absolute top-3 left-3 z-[1000] w-60">
      <form onSubmit={handleSubmit} className="glass rounded-xl p-1.5 flex gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a location..."
          className="input-dark flex-1 min-w-0 px-2 py-1.5 rounded-lg text-xs text-white placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="btn-primary px-3 py-1.5 rounded-lg text-xs shrink-0 disabled:opacity-50"
        >
          {isSearching ? "…" : "Go"}
        </button>
      </form>
      {error && (
        <p className="text-xs text-red-400 mt-1 px-1 bg-weather-dark/80 rounded inline-block">
          {error}
        </p>
      )}
    </div>
  );
}

export default function StationMap({
  stations,
  selectedStationId,
  onSelectStation,
  onMapClick,
  pendingMarker,
  mapTheme = "light",
  onLocationFound,
  searchMarker,
}: StationMapProps) {
  const center: [number, number] =
    stations.length > 0
      ? [
          stations.reduce((sum, s) => sum + s.latitude, 0) / stations.length,
          stations.reduce((sum, s) => sum + s.longitude, 0) / stations.length,
        ]
      : [-15.7861, 35.0058];

  const selectedStation = stations.find((s) => s.id === selectedStationId);

  return (
    <MapContainer
      center={center}
      zoom={9}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      className={`rounded-2xl overflow-hidden station-map ${mapTheme === "dark" ? "invert-map" : ""}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onMapClick && <ClickHandler onMapClick={onMapClick} />}
      <FlyToStation station={selectedStation} />
      {onLocationFound && <LocationSearchOverlay onFound={onLocationFound} />}

      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          icon={statusDivIcon(station.status, station.id === selectedStationId)}
          eventHandlers={{ click: () => onSelectStation(station.id) }}
        >
          <Popup>
            <div className="text-sm leading-snug">
              <p className="font-semibold text-gray-100">{station.name}</p>
              <p className="text-gray-400">
                {station.status === "online"
                  ? `Online — updated ${formatTimeAgo(station.lastSeenAt)}`
                  : `Station Offline — last seen ${formatTimeAgo(station.lastSeenAt)}`}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {pendingMarker && (
        <Marker position={[pendingMarker.lat, pendingMarker.lng]} icon={PENDING_ICON} />
      )}

      {searchMarker && (
        <Marker
          position={[searchMarker.lat, searchMarker.lng]}
          icon={SEARCH_RESULT_ICON}
        >
          <Popup>
            <p className="text-xs text-gray-200 max-w-[200px]">{searchMarker.label}</p>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}