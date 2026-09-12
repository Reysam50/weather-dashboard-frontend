import type { User } from "./types";

/**
 * TODO (frontend developer): replace with a real fetch to GET /users
 * once that endpoint exists (api-specification.md §3).
 */
export const mockUsers: User[] = [
  { id: "u1", name: "Kai Banda", email: "kai@caizwork.mw", role: "technical_team", stationIds: [] },
  { id: "u2", name: "Grace Phiri", email: "grace@unima.ac.mw", role: "administrator", stationIds: [] },
  { id: "u3", name: "Thoko Mvula", email: "thoko@unima.ac.mw", role: "station_operator", stationIds: ["1"] },
];