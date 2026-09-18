"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";
import { useAuth } from "@/lib/AuthContext";

/**
 * Fixed bottom nav bar for small screens — icon + label per item, active
 * item highlighted in blue. Pattern copied from WeatherNode's
 * resources/views/weather/partials/mobile-nav.blade.php.
 *
 * Filters NAV_ITEMS by CURRENT_ROLE, same as AppNav.tsx — see that file's
 * comment for why this only just became enforced.
 *
 * Icons are plain inline SVG (same approach WeatherNode uses) rather than
 * an icon library.
 */
const ICONS: Record<string, React.ReactNode> = {
  "/dashboard": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  "/reports": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-9 0h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  ),
  "/admin": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      />
    </svg>
  ),
  // Add an icon here for each new entry in lib/navigation.ts's NAV_ITEMS.
};

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <nav className="glass border-t border-white/10 fixed bottom-0 left-0 right-0 lg:hidden z-50">
      <div className="flex justify-around py-2">
        {visibleItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 ${
                active ? "text-blue-400" : "text-gray-400"
              }`}
            >
              {ICONS[item.href]}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}