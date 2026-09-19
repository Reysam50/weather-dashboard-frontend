export type Role = "technical_team" | "administrator" | "station_operator";

/** Display label for the header's role badge and account menu. */
export const ROLE_LABELS: Record<Role, string> = {
  technical_team: "Tech Team",
  administrator: "Administrator",
  station_operator: "Operator",
};