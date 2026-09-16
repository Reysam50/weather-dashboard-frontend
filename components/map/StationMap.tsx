"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Station } from "@/lib/types";
import { searchLocation } from "@/lib/geocode";

function statusDivIcon(status: Station["status"], isSelected: boolean) {
  // Cyan for the selected station, amber for other online stations, red
  // for offline — matches the Station Map redesign's legend (Online AWS /
  // Normal / Offline). Previously plain green/red; retinted to the site's
  // shared cyan/amber/error palette (tailwind.config.js) so this map
  // matches the rest of the app now that every screen shares one theme.
  const color = status === "offline" ? "#ffb4ab" : isSelected ? "#00e5ff" : "#ffb95f";
  const size = isSelected ? 18 : 14;
  const ring = isSelected ? `0 0 0 4px #00e5ff55, 0 0 0 8px ${color}33` : `0 0 0 4px ${color}33`;
  const pulseClass = status === "offline" ? "animate-ping" : isSelected ? "animate-pulse" : "";

  return L.divIcon({
    className: "",
    html: `
      <span style="position:relative; display:block; width:${size}px; height:${size}px;">
        ${
          pulseClass
            ? `<span class="${pulseClass}" style="position:absolute; inset:-6px; border-radius:9999px; background:${color}; opacity:0.35;"></span>`
            : ""
        }
        <span style="
          position:relative; display:block; width:${size}px; height:${size}px; border-radius:9999px;
          background:${color}; border:2px solid rgba(255,255,255,0.9);
          box-shadow:${ring};
        "></span>
      </span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const PENDING_ICON = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#00e5ff;border:2px solid white;"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const SEARCH_RESULT_ICON = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#d0bcff;border:2px solid white;"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface StationMapProps {
  /**
   * IMPORTANT: whatever wraps this component needs `isolate` (or another
   * way of creating a new stacking context) in its className. Leaflet's
   * own CSS gives its panes/controls z-index up to 1000, and without a
   * containing stacking context those values compare directly against
   * page chrome like a sticky header — and win. See
   * app/(protected)/stations/page.tsx's map wrapper for the pattern.
   */
  stations: Station[];
  selectedStationId: string | null;
  onSelectStation: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  pendingMarker?: { lat: number; lng: number } | null;
  mapTheme?: "light" | "dark";
  onLocationFound?: (lat: number, lng: number, label: string) => void;
  searchMarker?: { lat: number; lng: number; label: string } | null;
  /**
   * "Elevation Terrain" layer toggle from the Station Map redesign. Uses
   * OpenTopoMap (real topographic tiles, free, no API key) instead of
   * plain OSM — genuinely functional, unlike the redesign's decorative
   * illustrated terrain. Independent of `mapTheme`: the invert-filter dark
   * trick looks wrong applied to topo tiles, so terrain mode always shows
   * its natural colors regardless of mapTheme.
   */
  terrainMode?: boolean;
  /** Bumped by the parent to request a "fit all stations in view" recenter. */
  recenterSignal?: number;
  /** Called when the user clicks the custom "Center" button — parent should
   * bump `recenterSignal` in response. */
  onRecenterClick?: () => void;
  /** Shows the bottom-left status legend + custom zoom/center controls. */
  showControls?: boolean;
  /** Renders Leaflet's built-in click popup. Off by default on the Station
   * Map screen, which shows a richer floating inspect pod instead. */
  showPopups?: boolean;
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

function RecenterOnSignal({ stations, signal }: { stations: Station[]; signal?: number }) {
  const map = useMap();
  const firstRun = useRef(true);

  useEffect(() => {
    // Skip on mount — MapContainer's own `center`/`zoom` already handles
    // the initial view; this effect is only for the "Center" button.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (stations.length === 0) return;
    const bounds = L.latLngBounds(stations.map((s) => [s.latitude, s.longitude] as [number, number]));
    map.flyToBounds(bounds, { padding: [60, 60], duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal]);

  return null;
}

function MapControls({ stations, onRecenter }: { stations: Station[]; onRecenter: () => void }) {
  const map = useMap();

  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-1.5">
      <div className="bg-card-bg/90 backdrop-blur border border-border-line rounded-lg overflow-hidden flex flex-col shadow-lg">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          className="w-9 h-9 flex items-center justify-center text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors border-b border-border-line"
          aria-label="Zoom in"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          className="w-9 h-9 flex items-center justify-center text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors"
          aria-label="Zoom out"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
      </div>
      <button
        type="button"
        onClick={onRecenter}
        disabled={stations.length === 0}
        title="Center on all stations"
        className="h-9 px-2.5 flex items-center gap-1 bg-card-bg/90 backdrop-blur border border-border-line rounded-lg text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors shadow-lg font-mono text-[11px] disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[16px]">filter_center_focus</span>
        <span>Center</span>
      </button>
    </div>
  );
}

function MapLegend() {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-card-bg/90 backdrop-blur border border-border-line rounded-lg px-3 py-2 flex items-center gap-3 font-mono text-[10px] text-on-surface-variant shadow-lg">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary-container" /> Online AWS
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-secondary" /> Normal
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-error" /> Offline
      </span>
    </div>
  );
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
      <form onSubmit={handleSubmit} className="bg-card-bg/90 backdrop-blur border border-border-line rounded-xl p-1.5 flex gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a location..."
          className="bg-transparent flex-1 min-w-0 px-2 py-1.5 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="bg-primary-container text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs shrink-0 disabled:opacity-50"
        >
          {isSearching ? "…" : "Go"}
        </button>
      </form>
      {error && (
        <p className="text-xs text-error mt-1 px-2 py-1 bg-card-bg/90 rounded-lg inline-block">
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
  terrainMode = false,
  recenterSignal,
  onRecenterClick,
  showControls = false,
  showPopups = true,
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
      zoomControl={!showControls}
      style={{ height: "100%", width: "100%" }}
      className={`rounded-2xl overflow-hidden station-map ${
        !terrainMode && mapTheme === "dark" ? "invert-map" : ""
      }`}
    >
      {terrainMode ? (
        <TileLayer
          attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA) contributors'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        />
      ) : (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      )}

      {onMapClick && <ClickHandler onMapClick={onMapClick} />}
      <FlyToStation station={selectedStation} />
      {showControls && <RecenterOnSignal stations={stations} signal={recenterSignal} />}
      {onLocationFound && <LocationSearchOverlay onFound={onLocationFound} />}
      {showControls && (
        <MapControls stations={stations} onRecenter={() => onRecenterClick?.()} />
      )}
      {showControls && <MapLegend />}

      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          icon={statusDivIcon(station.status, station.id === selectedStationId)}
          eventHandlers={{ click: () => onSelectStation(station.id) }}
        >
          {showPopups && (
            <Popup>
              <div className="text-sm leading-snug">
                <p className="font-semibold text-gray-100">{station.name}</p>
                <p className="text-gray-400">
                  {station.status === "online" ? "Online" : "Offline"}
                </p>
              </div>
            </Popup>
          )}
        </Marker>
      ))}

      {pendingMarker && (
        <Marker position={[pendingMarker.lat, pendingMarker.lng]} icon={PENDING_ICON} />
      )}

      {searchMarker && (
        <Marker position={[searchMarker.lat, searchMarker.lng]} icon={SEARCH_RESULT_ICON}>
          <Popup>
            <p className="text-xs text-gray-200 max-w-[200px]">{searchMarker.label}</p>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}