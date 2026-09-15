export interface StationHardwareInfo {
  firmware: string;
  firmwareUpToDate: boolean;
  sensorSuite: { label: string; healthy: boolean }[];
  ingestMethod: string;
  geolocationLabel: string;
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
      { label: "SHT31 [Air]", healthy: true },
      { label: "BMP280 [Baro]", healthy: true },
      { label: "Dual Tipping Bucket", healthy: true },
    ],
    ingestMethod: "SSE WebSocket 60s stream",
    geolocationLabel: "Zomba District, UNIMA Campus Roof",
  },
  "2": {
    firmware: "v2.4.1-aws",
    firmwareUpToDate: true,
    sensorSuite: [
      { label: "SHT31 [Air]", healthy: true },
      { label: "BMP280 [Baro]", healthy: true },
      { label: "Single Bucket", healthy: true },
    ],
    ingestMethod: "Cellular 2G/LTE-M fallback",
    geolocationLabel: "Forestry Edge Post",
  },
  "3": {
    firmware: "v2.3.9-legacy",
    firmwareUpToDate: false,
    sensorSuite: [
      { label: "SHT31 [Unresponsive]", healthy: false },
      { label: "BMP280", healthy: true },
      { label: "Dual Gauges", healthy: true },
    ],
    ingestMethod: "Solar charge depletion alert",
    geolocationLabel: "Polytechnic / Chichiri Compound",
  },
};

const FALLBACK_HARDWARE: StationHardwareInfo = {
  firmware: "v2.4.1-aws",
  firmwareUpToDate: true,
  sensorSuite: [
    { label: "SHT31 [Air]", healthy: true },
    { label: "BMP280 [Baro]", healthy: true },
    { label: "Dual Tipping Bucket", healthy: true },
  ],
  ingestMethod: "SSE WebSocket 60s stream",
  geolocationLabel: "Unregistered geolocation label",
};

export function getStationHardware(stationId: string): StationHardwareInfo {
  return STATION_HARDWARE[stationId] ?? FALLBACK_HARDWARE;
}