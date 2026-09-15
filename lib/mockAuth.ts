export type Role = "technical_team" | "administrator" | "station_operator";

/**
 * TODO (frontend developer): replace both of these with real values from
 * GET /auth/me once the login flow is fully wired up
 * (system-architecture.md §5, api-specification.md §2).
 *
 * Centralized here so every page/component that needs "who is the current
 * user" reads from one place — previously CURRENT_ROLE was declared
 * locally inside the dashboard page, which would have meant copy-pasting
 * it (and inevitably letting it drift) into the reports page too.
 */
export const CURRENT_ROLE: Role = "technical_team";
export const ASSIGNED_STATION_ID = "1"; // only relevant when CURRENT_ROLE is "station_operator"

/** Display label for the header's role badge. */
export const ROLE_LABELS: Record<Role, string> = {
  technical_team: "Tech Team",
  administrator: "Administrator",
  station_operator: "Operator",
};