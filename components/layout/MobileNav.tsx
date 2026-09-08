"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";

/**
 * Fixed bottom nav bar for small screens — icon + label per item, active
 * item highlighted in blue. Pattern copied from WeatherNode's
 * resources/views/weather/partials/mobile-nav.blade.php.
 *
 * Icons are plain inline SVG (same approach WeatherNode uses) rather than
 * an icon library, since we only need two right now. If the nav grows
 * (Reports, Admin, etc.) it's worth switching to lucide-react instead of
 * hand-writing more paths here.
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
  // Add an icon here for each new entry in lib/navigation.ts's NAV_ITEMS.
};

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="glass border-t border-white/10 fixed bottom-0 left-0 right-0 lg:hidden z-50">
      <div className="flex justify-around py-2">
        {NAV_ITEMS.map((item) => {
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