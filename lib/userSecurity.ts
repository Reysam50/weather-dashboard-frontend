export interface UserSecurityProfile {
  title: string;
  verified: boolean;
  twoFactorEnforced: boolean;
  lastActivityLabel: string;
  lastActivityIp: string;
  sessionActive: boolean;
}

/**
 * Same "realistic per-record mock data, not a real backend yet" pattern as
 * lib/stationHardware.ts. Keyed by user id from lib/mockUsers.ts.
 *
 * Note: the redesign's mockup included a 4th "Analyst (Read Only)" role
 * that doesn't exist in this app's actual RBAC model (User["role"] only
 * has station_operator/administrator/technical_team, per
 * stakeholder-analysis.md) — rather than inventing a role the backend
 * doesn't support, the 5th user below uses a real role instead.
 */
export const USER_SECURITY: Record<string, UserSecurityProfile> = {
  u1: {
    title: "Lead Ingest Architect",
    verified: true,
    twoFactorEnforced: true,
    lastActivityLabel: "12 mins ago",
    lastActivityIp: "102.164.21.14",
    sessionActive: true,
  },
  u2: {
    title: "Dean of Climate Sciences",
    verified: true,
    twoFactorEnforced: true,
    lastActivityLabel: "Today 08:30 CAT",
    lastActivityIp: "41.70.18.2",
    sessionActive: true,
  },
  u3: {
    title: "UNIMA Field Station Custodian",
    verified: true,
    twoFactorEnforced: true,
    lastActivityLabel: "Yesterday 17:42 CAT",
    lastActivityIp: "41.70.19.88",
    sessionActive: false,
  },
  u4: {
    title: "Highland Sensor Calibration Officer",
    verified: true,
    twoFactorEnforced: true,
    lastActivityLabel: "3 days ago",
    lastActivityIp: "197.234.12.9",
    sessionActive: false,
  },
  u5: {
    title: "Agricultural Hydrology Researcher",
    verified: false,
    twoFactorEnforced: true,
    lastActivityLabel: "5 days ago",
    lastActivityIp: "41.70.20.104",
    sessionActive: false,
  },
};

const FALLBACK_PROFILE: UserSecurityProfile = {
  title: "System Operator",
  verified: false,
  twoFactorEnforced: false,
  lastActivityLabel: "Never",
  lastActivityIp: "—",
  sessionActive: false,
};

export function getUserSecurity(userId: string): UserSecurityProfile {
  return USER_SECURITY[userId] ?? FALLBACK_PROFILE;
}