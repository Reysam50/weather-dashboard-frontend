import LiveClock from "./LiveClock";

/**
 * Sticky glass header: logo + app name on the left, live clock in the
 * middle, role badge on the right. Visual pattern copied from
 * WeatherNode's <header id="site-header"> in resources/views/weather/layout.blade.php.
 *
 * TODO (frontend developer): "Y-NAXII Weather" and "Administrator" are
 * hardcoded placeholders. Once the login screen exists and calls
 * GET /auth/me, replace both with the real station name and the logged-in
 * user's actual role (system-architecture.md §5).
 */
export default function AppHeader() {
  return (
    <header className="glass border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight truncate">
              Y-NAXII Weather
            </h1>
            <p className="text-xs text-gray-400 truncate">
              Weather Monitoring Dashboard
            </p>
          </div>
        </div>

        <div className="hidden md:block">
          <LiveClock />
        </div>

        <div className="flex items-center gap-2 text-sm shrink-0">
          <span className="px-2 py-1 rounded bg-white/10 text-xs text-gray-300">
            Administrator
          </span>
        </div>
      </div>
    </header>
  );
}