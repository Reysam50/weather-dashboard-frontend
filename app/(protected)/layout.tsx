"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import MobileNav from "@/components/layout/MobileNav";
import { apiFetch, ApiError } from "@/lib/api";
import { StationProvider } from "@/lib/StationContext";
import { AdminSettingsProvider } from "@/lib/AdminSettingsContext";
import { PAGE_CONTAINER } from "@/lib/layout";

/**
 * Shared shell for every logged-in screen — currently /dashboard, /reports,
 * and /admin, and anything else we add later.
 *
 * The folder name "(protected)" is a Next.js *route group*: the parentheses
 * mean it is NOT part of the URL. app/(protected)/dashboard/page.tsx still
 * serves at exactly /dashboard — the folder only exists so these routes can
 * share this layout without /login (which should NOT have the header/nav)
 * being forced to share it too.
 *
 * Auth guard: calls GET /auth/me on mount, per system-architecture.md §5
 * and the TODO that used to live here and in lib/api.ts. Before this
 * existed, /dashboard, /reports, and /admin were all reachable directly by
 * URL even while logged out — only app/page.tsx's redirect checked
 * anything, and only for the root path.
 *
 * Deliberately distinguishes two different failure cases, since there's no
 * backend yet:
 * - A real 401 ("you are not logged in") → redirect to /login. This is the
 *   only case that should ever redirect.
 * - Anything else (network error because no backend exists yet, or a
 *   non-401 ApiError) → let the page render anyway, with a console
 *   warning. A request that couldn't reach a server isn't evidence the
 *   person is logged out — treating it as one would make every protected
 *   page permanently unreachable during frontend-only development.
 *
 * IMPORTANT: this is a client-side UX check only, not the real security
 * boundary. It stops someone from casually landing on a page whose data
 * calls will immediately 401 anyway — it does NOT stop a determined
 * attacker, who can trivially skip past client-side JS. The actual
 * boundary has to be the backend rejecting unauthenticated requests to
 * every real endpoint, independent of whatever this layout does.
 */
type AuthState = "checking" | "ready";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    let cancelled = false;

    apiFetch("/auth/me")
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return "redirecting" as const;
        }
        // No backend yet, or a transient error — not proof of "logged
        // out," so don't redirect. Once a real backend exists this branch
        // mostly just means "server briefly unreachable."
        console.warn(
          "GET /auth/me failed without a 401 — letting the page render anyway:",
          err
        );
        return "ready" as const;
      })
      .then((result) => {
        if (cancelled) return;
        if (result !== "redirecting") setAuthState("ready");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (authState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <StationProvider>
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
    </StationProvider>
  );
}