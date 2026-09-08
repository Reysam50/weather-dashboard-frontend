/**
 * Single source of truth for top-level nav destinations, shared by the
 * desktop tab bar (components/layout/AppNav.tsx) and the mobile bottom nav
 * (components/layout/MobileNav.tsx) so the two can never drift out of sync.
 *
 * `roles` records who *should* eventually see each item, per
 * stakeholder-analysis.md's permission table — not enforced yet. Once the
 * login screen + GET /auth/me are wired up, filter this array by the
 * current user's role before rendering either nav component.
 */

export type Role = "station_operator" | "administrator" | "technical_team";

export interface NavItem {
  href: string;
  label: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["station_operator", "administrator", "technical_team"],
  },
  {
    href: "/reports",
    label: "Reports",
    // All roles can export/schedule reports — Station Operator is just
    // scoped to their own station (enforced inside the Reports page/API,
    // not by hiding the nav item).
    roles: ["station_operator", "administrator", "technical_team"],
  },
  // Add future top-level pages here — AppNav.tsx and MobileNav.tsx both
  // read from this single array, so a new entry shows up in both
  // automatically.
];