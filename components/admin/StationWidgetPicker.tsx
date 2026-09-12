"use client";

import { useEffect, useState } from "react";
import type { Station } from "@/lib/types";
import type { WidgetCategory } from "@/lib/widgetCatalog";
import { WIDGET_CATALOG, DEFAULT_ENABLED_WIDGET_IDS, isWidgetAvailable } from "@/lib/widgetCatalog";
import { loadStationWidgetIds, saveStationWidgetIds } from "@/lib/stationWidgetConfig";
import StationList from "@/components/map/StationList";

interface StationWidgetPickerProps {
  stations: Station[];
}

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  "big-number": "Big Number",
  chart: "Charts",
  table: "Tables",
};

/**
 * The ThingsBoard-style "pick which widgets are available for this piece
 * of equipment" panel — pick a station on the left, toggle widgets for it
 * on the right. Writes to lib/stationWidgetConfig.ts, which the dashboard
 * page reads to decide what to actually render for the selected station.
 *
 * Reuses StationList.tsx (canManage=false, so no "+ Add Station" button
 * shows here) for the station picker instead of building a new one —
 * same search+scroll+select behavior the dashboard already uses.
 */
export default function StationWidgetPicker({ stations }: StationWidgetPickerProps) {
  const [selectedStationId, setSelectedStationId] = useState<string>(
    stations[0]?.id ?? ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [enabledIds, setEnabledIds] = useState<string[]>(DEFAULT_ENABLED_WIDGET_IDS);

  useEffect(() => {
    if (!selectedStationId) return;
    setEnabledIds(loadStationWidgetIds(selectedStationId, DEFAULT_ENABLED_WIDGET_IDS));
  }, [selectedStationId]);

  function toggleWidget(id: string) {
    setEnabledIds((current) => {
      const next = current.includes(id)
        ? current.filter((w) => w !== id)
        : [...current, id];
      saveStationWidgetIds(selectedStationId, next);
      return next;
    });
  }

  const categories: WidgetCategory[] = ["big-number", "chart", "table"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <div className="h-96">
        <StationList
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={setSelectedStationId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          canManage={false}
          onAddStationClick={() => {}}
        />
      </div>

      <div className="bg-weather-card rounded-2xl border border-white/10 p-4 md:p-6 space-y-6">
        {!selectedStationId ? (
          <p className="text-sm text-gray-500">Select a station to configure its widgets.</p>
        ) : (
          categories.map((category) => {
            const entries = WIDGET_CATALOG.filter((w) => w.category === category);
            return (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {CATEGORY_LABELS[category]}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {entries.map((entry) => {
                    const available = isWidgetAvailable(entry);
                    const enabled = enabledIds.includes(entry.id);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        disabled={!available}
                        onClick={() => toggleWidget(entry.id)}
                        className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                          enabled
                            ? "bg-blue-600/20 border-blue-500/40"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        } ${!available ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{entry.name}</span>
                          {enabled && available && (
                            <span className="text-blue-400 text-xs shrink-0">On</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{entry.description}</p>
                        {!available && (
                          <p className="text-xs text-amber-500/80 mt-1">
                            Requires: {entry.requiresSensors?.join(", ")} — not available on this hardware
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}