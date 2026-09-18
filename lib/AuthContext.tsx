"use client";

import { createContext, useContext } from "react";
import type { Role } from "./mockAuth";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  /** Station IDs this user can access. "all" for administrator/technical_team
   * (per api-specification.md §2) — never enumerated as an array for them. */
  stations: string[] | "all";
}

interface AuthContextValue {
  user: AuthUser;
  /** True if this came from a real GET /auth/me response; false if it's the
   * dev-mode fallback because no backend is reachable yet. Lets screens
   * that want to know (there aren't many) distinguish "really logged in
   * as an operator" from "no backend, using the mock". */
  isRealSession: boolean;
}

// No default value — every screen that reads this is inside
// app/(protected)/layout.tsx, which always provides one. A component
// rendered outside that layout calling useAuth() is a real bug, and
// throwing here (like StationContext/AdminSettingsContext do) surfaces
// it immediately instead of quietly handing back a fake user.
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  user,
  isRealSession,
  children,
}: {
  user: AuthUser;
  isRealSession: boolean;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={{ user, isRealSession }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider (inside app/(protected)/layout.tsx)");
  }
  return ctx;
}

/** True for administrator/technical_team, matching the "stations: 'all'"
 * convention from api-specification.md §2 — the one check every
 * role-gated screen/button needs, so it isn't reimplemented differently
 * in five different files. */
export function canAccessAllStations(user: AuthUser): boolean {
  return user.stations === "all";
}