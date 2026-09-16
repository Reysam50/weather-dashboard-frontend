import type { User } from "./types";

/**
 * TODO (frontend developer): replace with a real fetch to GET /users
 * once that endpoint exists (api-specification.md §3).
 *
 * See lib/userSecurity.ts for the extra per-user fields (title, 2FA
 * status, last activity) the Admin screen's roster table shows.
 */
export const mockUsers: User[] = [
  { id: "u1", name: "Kai Banda", email: "kai@caizwork.mw", role: "technical_team", stationIds: [] },
  { id: "u2", name: "Grace Phiri", email: "grace@unima.ac.mw", role: "administrator", stationIds: [] },
  { id: "u3", name: "Thoko Mvula", email: "thoko@unima.ac.mw", role: "station_operator", stationIds: ["1"] },
  { id: "u4", name: "Dr. Chisale", email: "p.chisale@met.gov.mw", role: "station_operator", stationIds: ["2"] },
  { id: "u5", name: "M. Gondwe", email: "m.gondwe@agri.unima.mw", role: "administrator", stationIds: [] },
];