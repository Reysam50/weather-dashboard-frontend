"use client";

import { useEffect, useState } from "react";

/**
 * Ticking clock + green "live" dot, shown in the header — mirrors the
 * #currentTime element in WeatherNode's layout.blade.php.
 *
 * This has to be a Client Component ("use client" above) because it uses
 * setInterval/useState, which only make sense in the browser — the server
 * can't keep a timer running for you.
 */
export default function LiveClock() {
  // Starts as null on purpose: the server renders this component once with
  // no way of knowing the visitor's local time, and the client's first
  // render must match that exactly or React logs a hydration-mismatch
  // warning. We fill in the real time only after mounting (see useEffect).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <span className="font-display text-gray-300">--:--:--</span>;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className="live-indicator inline-block w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
        aria-hidden="true"
      />
      <span className="font-display text-gray-300 data-value">
        {now.toLocaleTimeString([], { hour12: false })}
      </span>
      <span className="text-gray-500">|</span>
      <span className="text-gray-300">
        {now.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
  );
}