"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Station } from "@/lib/types";

/**
 * Leaflet touches `window`/`document`, so this component only ever renders
 * client-side — wherever it's used, it's imported with next/dynamic and
 * ssr:false (same reason as the ApexCharts widgets).
 *
 * Leaflet also ships marker icon images that most bundlers, Next.js's
 * included, fail to resolve correctly out of the box — you end up with
 * broken "missing image" markers unless you manually patch the icon paths.
 * Sidestepping that entirely by building markers from a plain colored
 * <span> via L.divIcon instead of Leaflet's default image-based icon — no
 * broken-image problem, and it's trivial to color by station status.
 */
function statusDivIcon(status: Station["status"], isSelected: boolean) {
  const color = status === "online" ? "#22c55e" : "#ef4444";
  const size = isSelected ? 18 : 14;
  const ring = isSelected ? `0 0 0 4px #3b82f6aa, 0 0 0 8px ${color}33` : `0 0 0 4px ${color}33`;

  return L.divIcon({
    className: "", // strip Leaflet's default white-box icon styling
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

interface StationMapProps {
  stations: Station[];
  selectedStationId: string | null;
  onSelectStation: (id: string) => void;
  /** When set, clicking anywhere on the map reports the lat/lng here
   * instead of doing anything else — used by the "Add Station" flow. */
  onMapClick?: (lat: number, lng: number) => void;
  pendingMarker?: { lat: number; lng: number } | null;
  /**
   * "light" (default) is plain OpenStreetMap tiles as-is. "dark" applies a
   * CSS color-invert filter over the same tiles to fake a dark basemap —
   * see .invert-map in globals.css.
   *
   * TODO (frontend developer): this is hardcoded by whoever calls
   * StationMap for now. Once an admin settings screen exists, this should
   * come from a stored preference instead (e.g. GET /settings or a user
   * preference), so people can choose light vs dark map without a code
   * change — this prop already exists specifically to make that a
   * one-line wiring change later rather than a redesign.
   */
  mapTheme?: "light" | "dark";
}

/** react-leaflet has no `onClick` prop on MapContainer — map click events
 * are only available via this hook, used inside a child of MapContainer. */
function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Pans/zooms the map to a station whenever it becomes selected — this is
 * what makes clicking a station's name in the sidebar list "jump to" it on
 * the map, not just highlight it.
 *
 * Leaflet's pan/zoom controls (flyTo) live on the map *instance*, not as
 * MapContainer props — react-leaflet's useMap() hook is the only way to
 * reach that instance, and it only works inside a component rendered as a
 * child of MapContainer (hence this being a separate tiny component
 * instead of just calling flyTo directly in StationMap itself).
 */
function FlyToStation({ station }: { station: Station | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (!station) return;
    // Don't zoom OUT if the user's already zoomed in closer than 12 —
    // only zoom in when needed, never yank the view wider than it was.
    map.flyTo([station.latitude, station.longitude], Math.max(map.getZoom(), 12), {
      duration: 1,
    });
    // Depend on the primitive id/lat/lng rather than the `station` object
    // itself, so this doesn't re-fire just because the parent re-rendered
    // and created a new object with the same values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station?.id, station?.latitude, station?.longitude]);

  return null;
}

export default function StationMap({
  stations,
  selectedStationId,
  onSelectStation,
  onMapClick,
  pendingMarker,
  mapTheme = "light",
}: StationMapProps) {
  // Center the map on the average of all station coordinates, so it opens
  // already framing your actual stations instead of a hardcoded location.
  // Falls back to Blantyre, Malawi if there are no stations yet.
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
      {/* Standard OpenStreetMap tiles — free for reasonable non-commercial
          use, no API key/signup required. (CARTO's dark tile set, used
          here previously, started requiring a free-but-mandatory API key
          in August 2026 — see carto.com/basemaps/apikey.) When mapTheme is
          "dark", .invert-map in globals.css fakes a dark basemap on top of
          these same light tiles via a CSS filter, rather than depending on
          a separate (possibly paid/keyed) dark tile provider. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onMapClick && <ClickHandler onMapClick={onMapClick} />}
      <FlyToStation station={selectedStation} />

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
              {/* Confirmed wording per FR-10.2 — "Station Offline", not
                  "missing data" or similar. Softer gray than pure white
                  here on purpose — see the .station-map popup rules in
                  globals.css for why the raw white-on-dark looked harsh. */}
              <p className="text-gray-400">
                {station.status === "online" ? "Online" : "Station Offline"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {pendingMarker && (
        <Marker position={[pendingMarker.lat, pendingMarker.lng]} icon={PENDING_ICON} />
      )}
    </MapContainer>
  );
}