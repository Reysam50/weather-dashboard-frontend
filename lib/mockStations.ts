import type { Station } from "./types";

export const mockStations: Station[] = [
  {
    id: "1",
    name: "Chancellor College",
    latitude: -15.386,
    longitude: 35.3182,
    particleDeviceId: "3a0021000747343232363230",
    status: "online",
    lastSeenAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "Zomba Plateau",
    latitude: -15.3833,
    longitude: 35.35,
    particleDeviceId: "2b0031000847232131353120",
    status: "online",
    lastSeenAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Blantyre CBD",
    latitude: -15.7861,
    longitude: 35.0058,
    particleDeviceId: "1c0041000947121030242020",
    status: "offline",
    lastSeenAt: new Date(Date.now() - 780 * 60 * 1000).toISOString(),
  },
];