export interface StationHardwareInfo {
  firmware: string;
  firmwareUpToDate: boolean;
  sensorSuite: { label: string; healthy: boolean }[];
  ingestMethod: string;
  geolocationLabel: string;
  /** Real-world-plausible elevation for this site (Zomba Plateau genuinely
   * sits ~1,500m up; Blantyre and Zomba town are both roughly 900-1,100m) —
   * used by the Station Compare screen's microclimate/inversion analysis. */
  elevationM: number;
  terrainLabel: string;
  gatewayLabel: string;
  /** Synthetic-but-consistent signal quality (0-100) — there's no real
   * RSSI reading behind this, same "plausible not literal" mock pattern
   * as wind speed and solar radiation elsewhere in this app. */
  signalPct: number;
}

/**
 * Static-ish hardware metadata, same "realistic per-station mock data"
 * pattern as lib/mockStationData.ts — not from a real provisioning
 * database yet, but distinct and plausible per station rather than
 * copy-pasted placeholder text.
 */
export const STATION_HARDWARE: Record<string, StationHardwareInfo> = {
  "1": {
    firmware: "v2.4.1-aws",
    firmwareUpToDate: true,
    sensorSuite: [
      { label: "MCP9808 [Primary Temp]", healthy: true },
      { label: "BMP360 [Baro]", healthy: true },
      { label: "SHT31 [Humidity]", healthy: true },
      { label: "451A x2 [Rain]", healthy: true },
    ],
    ingestMethod: "SSE WebSocket 60s stream",
    geolocationLabel: "Zomba District, UNIMA Campus Roof",
    elevationM: 948,
    terrainLabel: "BASIN",
    gatewayLabel: "Particle Boron LTE // AWS #01",
    signalPct: 98,
  },
  "2": {
    firmware: "v2.4.1-aws",
    firmwareUpToDate: true,
    sensorSuite: [
      { label: "MCP9808 [Primary Temp]", healthy: true },
      { label: "BMP360 [Baro]", healthy: true },
      { label: "SHT31 [Humidity]", healthy: true },
      { label: "451A x1 [Rain]", healthy: true },
    ],
    ingestMethod: "Cellular 2G/LTE-M fallback",
    geolocationLabel: "Forestry Edge Post",
    elevationM: 1533,
    terrainLabel: "ESCARPMENT",
    gatewayLabel: "Particle Boron LTE // AWS #02",
    signalPct: 89,
  },
  "3": {
    firmware: "v2.3.9-legacy",
    firmwareUpToDate: false,
    sensorSuite: [
      { label: "MCP9808 [Primary Temp]", healthy: true },
      { label: "BMP360 [Baro]", healthy: true },
      { label: "SHT31 [Unresponsive]", healthy: false },
      { label: "451A x2 [Rain]", healthy: true },
    ],
    ingestMethod: "Solar charge depletion alert",
    geolocationLabel: "Polytechnic / Chichiri Compound",
    elevationM: 1039,
    terrainLabel: "URBAN",
    gatewayLabel: "Particle Boron LTE // AWS #03",
    signalPct: 12,
  },
};

const FALLBACK_HARDWARE: StationHardwareInfo = {
  firmware: "v2.4.1-aws",
  firmwareUpToDate: true,
  sensorSuite: [
    { label: "MCP9808 [Primary Temp]", healthy: true },
    { label: "BMP360 [Baro]", healthy: true },
    { label: "SHT31 [Humidity]", healthy: true },
    { label: "451A x2 [Rain]", healthy: true },
  ],
  ingestMethod: "SSE WebSocket 60s stream",
  geolocationLabel: "Unregistered geolocation label",
  elevationM: 1000,
  terrainLabel: "FIELD SITE",
  gatewayLabel: "Particle Boron LTE // Unassigned",
  signalPct: 80,
};

export function getStationHardware(stationId: string): StationHardwareInfo {
  return STATION_HARDWARE[stationId] ?? FALLBACK_HARDWARE;
}