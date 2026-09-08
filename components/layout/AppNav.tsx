"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";

/**
 * Desktop horizontal nav tabs, in a glass bar under the header. Copies
 * WeatherNode's pill-style active tab (solid blue background + glow shadow)
 * from resources/views/weather/partials/navigation.blade.php.
 *
 * "use client" is required because usePathname() needs to know the current
 * URL in the browser to highlight the active tab — Server Components can't
 * do that.
 *
 * Hidden below the `lg` breakpoint; MobileNav.tsx takes over on small
 * screens instead of squeezing these tabs into a scrollable row.
 */
export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="glass border-b border-white/5 hidden lg:block">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 py-2 text-sm">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  active
                    ? "bg-blue-600 shadow-lg shadow-blue-600/30"
                    : "text-gray-300 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}