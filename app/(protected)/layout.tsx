"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import MobileNav from "@/components/layout/MobileNav";
import { apiFetch, ApiError } from "@/lib/api";
import { StationProvider } from "@/lib/StationContext";
import { AdminSettingsProvider } from "@/lib/AdminSettingsContext";
import { AuthProvider, type AuthUser } from "@/lib/AuthContext";
import { NotificationsProvider } from "@/lib/NotificationsContext";
import { getMockSession } from "@/lib/mockSession";
import { PAGE_CONTAINER } from "@/lib/layout";

/**
 * Shared shell for every logged-in screen.
 *
 * Auth guard: calls GET /auth/me on mount, per system-architecture.md §5
 * and api-specification.md §2. Distinguishes two different failure cases,
 * since there's no backend yet:
 * - A real 401 ("you are not logged in") → redirect to /login.
 * - A network error (no backend reachable yet) → check for a dev-mode
 *   mock session instead (lib/mockSession.ts, set by actually logging in
 *   on /login with the NEXT_PUBLIC_DEV_LOGIN_* account) — if one exists,
 *   use it; if not, this is genuinely "not logged in," so redirect to
 *   /login same as a real 401. Previously this branch granted access
 *   unconditionally via a hardcoded fallback user regardless of whether
 *   you'd ever logged in at all — fixed, since "am I logged in?" needs a
 *   real answer even before a backend exists.
 *
 * The successful response is now kept (not just used for the redirect
 * check) and provided via AuthContext, so every screen reads the real
 * role/station-scope from lib/AuthContext.tsx's useAuth() instead of the
 * old hardcoded CURRENT_ROLE constant.
 *
 * Route gating: /stations (Station Map) and /admin are Administrator and
 * Technical Team only per stakeholder-analysis.md's permission table —
 * a Station Operator landing on either (typed URL, bookmark, stale link)
 * gets bounced to /dashboard. This mirrors the same hiding already done
 * in lib/headerNav.ts, but that only hides the nav tab — it doesn't stop
 * direct navigation, which this does. Same caveat as always: this is a
 * client-side UX nicety, not the real security boundary. That's the
 * backend rejecting the request server-side, independent of this check.
 */
const RESTRICTED_PATHS = ["/stations", "/admin"];

type AuthState = "checking" | "ready";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRealSession, setIsRealSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ id: string; email: string; role: AuthUser["role"]; stations: string[] | "all" }>(
      "/auth/me"
    )
      .then((me) => {
        if (cancelled) return;
        setUser({ id: me.id, email: me.email, role: me.role, stations: me.stations });
        setIsRealSession(true);
        setAuthState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        // No backend reachable — check for a dev-mode mock session
        // (only exists if you actually logged in on /login) before
        // deciding whether that counts as "logged in."
        const mockSession = getMockSession();
        if (!mockSession) {
          router.replace("/login");
          return;
        }
        setUser(mockSession);
        setIsRealSession(false);
        setAuthState("ready");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (authState !== "ready" || !user) return;
    const isRestricted = RESTRICTED_PATHS.some((p) => pathname.startsWith(p));
    if (isRestricted && user.role === "station_operator") {
      router.replace("/dashboard");
    }
  }, [authState, user, pathname, router]);

  if (authState === "checking" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <AuthProvider user={user} isRealSession={isRealSession}>
      <StationProvider>
        <NotificationsProvider>
          <AdminSettingsProvider>
            {/* AppHeader now carries the primary nav tabs itself (the redesign
                merges what used to be AppHeader + AppNav into one bar) — see
                AppHeader.tsx's comment. AppNav.tsx is gone; MobileNav still
                covers small screens on its own, from lib/navigation.ts. */}
            <AppHeader />
            {/* pb-24 leaves room for the fixed mobile bottom nav so it never
                covers the last bit of content on small screens; lg:pb-6 removes
                that extra space once MobileNav is hidden. PAGE_CONTAINER is the
                exact same max-width + padding AppHeader uses, so the header and
                this content area always line up — see lib/layout.ts. */}
            <main className={`${PAGE_CONTAINER} py-8 pb-24 lg:pb-8`}>{children}</main>
            <MobileNav />
          </AdminSettingsProvider>
        </NotificationsProvider>
      </StationProvider>
    </AuthProvider>
  );
}