import type { Station } from "./types";

/**
 * TODO (frontend developer): replace with a real fetch to GET /stations
 * once that endpoint exists (api-specification.md §4). Moved here from
 * the dashboard page so the reports page can use the exact same list
 * instead of a second hardcoded copy.
 */
export const mockStations: Station[] = [
  {
    id: "1",
    name: "Chancellor College",
    latitude: -15.386,
    longitude: 35.3182,
    particleDeviceId: "3a0021000747343232363230",
    status: "online",
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Zomba Plateau",
    latitude: -15.3833,
    longitude: 35.35,
    particleDeviceId: "2b0031000847232131353120",
    status: "online",
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Blantyre CBD",
    latitude: -15.7861,
    longitude: 35.0058,
    particleDeviceId: "1c0041000947121030242020",
    status: "offline",
    lastSeenAt: "2026-09-04T08:15:00Z",
  },
];