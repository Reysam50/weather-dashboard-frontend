"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LiveClock from "./LiveClock";
import StationDropdown from "./StationDropdown";
import NotificationsPanel from "./NotificationsPanel";
import AccountMenu from "./AccountMenu";
import { HEADER_NAV_ITEMS } from "@/lib/headerNav";
import { ROLE_LABELS } from "@/lib/mockAuth";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationsContext";
import { PAGE_CONTAINER } from "@/lib/layout";

/**
 * Header + primary nav, merged into one bar — this is the screen the user
 * named as source of truth for the whole redesign (Live Telemetry
 * Dashboard), so every other screen's header should match this one exactly
 * as we get to it.
 *
 * Previously AppHeader and AppNav (components/layout/AppNav.tsx) were two
 * separate stacked bars; the redesign puts the nav tabs inside the header
 * itself, so AppNav is no longer used by app/(protected)/layout.tsx. The
 * mobile bottom nav (MobileNav.tsx) is unaffected — it still reads from its
 * own lib/navigation.ts, which intentionally lists fewer/different items
 * than HEADER_NAV_ITEMS below (see headerNav.ts's comment for why).
 *
 * Role now comes from the real GET /auth/me response (lib/AuthContext.tsx)
 * instead of a hardcoded constant, so nav visibility and the role badge
 * genuinely reflect who's logged in.
 */
export default function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const visibleNavItems = HEADER_NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <header className="sticky top-0 z-50 w-full bg-[#090d16]/95 backdrop-blur-md border-b border-border-line">
      <div className={`${PAGE_CONTAINER} h-20 flex items-center justify-between gap-3 overflow-hidden`}>
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-max flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/30 flex items-center justify-center text-primary-container shadow-[0_0_15px_rgba(0,229,255,0.15)] flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">radar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white uppercase">
              Y-NAXII Meteorological
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
        </div>

        {/* Center nav tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-card-bg p-1 rounded-xl border border-border-line flex-shrink-0">
          {visibleNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.dataPath}
                href={item.href}
                data-path={item.dataPath}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs tracking-wide whitespace-nowrap transition-colors ${
                  active
                    ? "bg-cyan-500/15 text-primary-container font-semibold border border-cyan-500/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right utility cluster */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <StationDropdown />
          <LiveClock />

          <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-secondary font-mono text-xs font-semibold">
            <span className="material-symbols-outlined text-[15px]">shield</span>
            <span>{ROLE_LABELS[user.role]}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            className="relative w-9 h-9 rounded-xl bg-card-bg border border-border-line hover:border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#090d16]" />
            )}
          </button>

          <AccountMenu />
        </div>
      </div>

      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
    </header>
  );
}