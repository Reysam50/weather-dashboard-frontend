import type { Role } from "./navigation";

/**
 * The redesign merges nav into the header itself and groups things
 * differently than lib/navigation.ts's 3 mobile-nav items: Station Compare
 * and Station Map are their own tabs here, matching the Stitch screens
 * multi_station_comparison_correlation_redesigned and
 * station_management_map_hardware_provisioning_redesigned. This is the
 * header's OWN source of truth — kept separate from NAV_ITEMS (used by
 * MobileNav.tsx) rather than merged into it, since the two navs genuinely
 * disagree on how many top-level destinations there are.
 *
 * Station Compare doesn't have a real route yet (that screen hasn't been
 * rebuilt), so its href is a placeholder until that screen's turn comes.
 */
export interface HeaderNavItem {
  href: string;
  label: string;
  dataPath: string;
  roles: Role[];
}

export const HEADER_NAV_ITEMS: HeaderNavItem[] = [
  {
    href: "/dashboard",
    label: "Live",
    dataPath: "live-dashboard",
    roles: ["station_operator", "administrator", "technical_team"],
  },
  {
    href: "#",
    label: "Compare",
    dataPath: "multi-station-comparison",
    roles: ["administrator", "technical_team"],
  },
  {
    href: "/reports",
    label: "Reports",
    dataPath: "reports-export",
    roles: ["station_operator", "administrator", "technical_team"],
  },
  {
    href: "/stations",
    label: "Map",
    dataPath: "station-management-map",
    roles: ["administrator", "technical_team"],
  },
  {
    href: "/admin",
    label: "Admin",
    dataPath: "admin-access-control",
    // Same restriction as Station Map above (stakeholder-analysis.md):
    // Station Operator has no access to user/station administration at
    // all, so the tab shouldn't even appear for that role, not just be
    // disabled.
    roles: ["administrator", "technical_team"],
  },
];
