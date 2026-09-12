/**
 * Single source of truth for top-level nav destinations, shared by the
 * desktop tab bar (components/layout/AppNav.tsx) and the mobile bottom nav
 * (components/layout/MobileNav.tsx) so the two can never drift out of sync.
 *
 * `roles` records who can see each item, per stakeholder-analysis.md's
 * permission table — enforced by both nav components, which filter
 * NAV_ITEMS against lib/mockAuth.ts's CURRENT_ROLE before rendering.
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
  {
    href: "/admin",
    label: "Admin",
    // /users is Administrator + Technical Team only (api-specification.md
    // §3) — Station Operator genuinely cannot use this page, unlike
    // Reports above, so it's actually filtered out for that role now (see
    // AppNav.tsx / MobileNav.tsx).
    roles: ["administrator", "technical_team"],
  },
  // Add future top-level pages here — AppNav.tsx and MobileNav.tsx both
  // read from this single array, so a new entry shows up in both
  // automatically.
];