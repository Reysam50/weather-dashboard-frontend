export type Role = "technical_team" | "administrator" | "station_operator";

/** Display label for the header's role badge and account menu. */
export const ROLE_LABELS: Record<Role, string> = {
  technical_team: "Tech Team",
  administrator: "Administrator",
  station_operator: "Operator",
};

/**
 * Dev-mode fallback user, used only when there's no backend to answer
 * GET /auth/me yet (see app/(protected)/layout.tsx). Every screen reads
 * the current user from lib/AuthContext.tsx's useAuth() now, not from
 * here directly — this just supplies what that context falls back to.
 * Once a real backend exists, this stops being used automatically; no
 * screen code needs to change.
 */
export const MOCK_FALLBACK_USER = {
  id: "mock-user",
  email: "kai@caizwork.mw",
  role: "technical_team" as Role,
  stations: "all" as const,
};