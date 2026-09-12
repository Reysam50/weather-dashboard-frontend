"use client";

interface SettingsPanelProps {
  mapTheme: "light" | "dark";
  onMapThemeChange: (theme: "light" | "dark") => void;
}

/**
 * System-wide settings. Currently just Map Theme — this is the setting
 * mentioned earlier when we built the station map ("the map theme should
 * be a setting in the admin panel later on"). Persisted via
 * lib/adminSettings.ts (localStorage for now; see its TODO for the real
 * settings-API version).
 *
 * More settings (units, notification defaults, etc.) can be added as
 * additional cards here later without changing how this one works.
 */
export default function SettingsPanel({
  mapTheme,
  onMapThemeChange,
}: SettingsPanelProps) {
  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 p-4 md:p-6">
      <h2 className="text-sm font-semibold text-gray-200 mb-1">Map Theme</h2>
      <p className="text-xs text-gray-400 mb-4">
        Controls the basemap style used on the dashboard&apos;s station map.
      </p>

      <div className="flex gap-2">
        {(["light", "dark"] as const).map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={() => onMapThemeChange(theme)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              mapTheme === theme
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            {theme}
          </button>
        ))}
      </div>
    </div>
  );
}