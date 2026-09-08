"use client";

import { useState } from "react";

export interface ToggleListItem {
  id: string;
  label: string;
  /** Optional small color dot before the label (station status, metric color). */
  dotColor?: string;
}

interface SearchableToggleListProps {
  title: string;
  items: ToggleListItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  maxSelected?: number;
  searchPlaceholder?: string;
}

/**
 * Card with a search box + scrollable list of pill-style toggle buttons.
 * Shared by CompareStationsPanel and CompareMetricsPanel so both "pick
 * some things to compare" pickers look and behave identically instead of
 * drifting apart over time.
 *
 * Selection is a solid highlight on the button itself (like a tab /
 * segmented control), not a checkbox — matches the reference "All-time
 * records" pill row rather than a form control.
 */
export default function SearchableToggleList({
  title,
  items,
  selectedIds,
  onToggle,
  maxSelected,
  searchPlaceholder = "Search...",
}: SearchableToggleListProps) {
  const [query, setQuery] = useState("");
  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 p-4 flex flex-col h-72">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
        {maxSelected && (
          <span className="text-xs text-gray-500">
            {selectedIds.length}/{maxSelected}
          </span>
        )}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        className="input-dark w-full px-3 py-2 rounded-lg text-sm text-white placeholder:text-gray-500 mb-3"
      />

      <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 px-2 py-4">No matches.</p>
        ) : (
          filtered.map((item) => {
            const selected = selectedIds.includes(item.id);
            const atLimit =
              !selected && !!maxSelected && selectedIds.length >= maxSelected;
            return (
              <button
                key={item.id}
                type="button"
                disabled={atLimit}
                onClick={() => onToggle(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  selected
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-gray-300 hover:bg-white/10"
                } ${atLimit ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {item.dotColor && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.dotColor }}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}