"use client";

import { useState } from "react";
import type { User, Station } from "@/lib/types";
import SearchableToggleList from "@/components/dashboard/SearchableToggleList";

interface UserFormProps {
  stations: Station[];
  editingUser: User | null;
  onSave: (user: Omit<User, "id"> & { id?: string }) => void;
  onCancel: () => void;
}

const ROLE_OPTIONS: { value: User["role"]; label: string }[] = [
  { value: "station_operator", label: "Station Operator" },
  { value: "administrator", label: "Administrator" },
  { value: "technical_team", label: "Technical Team" },
];

/**
 * Add/edit user form — matches POST /users, PATCH /users/{id}, and
 * POST /users/{id}/stations (api-specification.md §3). Station assignment
 * only appears for Station Operator: per stakeholder-analysis.md,
 * Administrator/Technical Team already see every station, so assigning
 * them to specific ones wouldn't mean anything.
 *
 * Reuses SearchableToggleList (built for the dashboard's comparison
 * pickers) for station assignment rather than a new multi-select control —
 * same "search + scrollable pill list" pattern applies here too.
 */
export default function UserForm({
  stations,
  editingUser,
  onSave,
  onCancel,
}: UserFormProps) {
  const [name, setName] = useState(editingUser?.name ?? "");
  const [email, setEmail] = useState(editingUser?.email ?? "");
  const [role, setRole] = useState<User["role"]>(editingUser?.role ?? "station_operator");
  const [stationIds, setStationIds] = useState<string[]>(editingUser?.stationIds ?? []);

  function toggleStation(id: string) {
    setStationIds((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    );
  }

  const canSave = name.trim().length > 0 && email.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      id: editingUser?.id,
      name: name.trim(),
      email: email.trim(),
      role,
      stationIds: role === "station_operator" ? stationIds : [],
    });
  }

  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 p-4 md:p-6">
      <h2 className="text-sm font-semibold text-gray-200 mb-4">
        {editingUser ? "Edit User" : "Add User"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-dark w-full px-3 py-2 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-dark w-full px-3 py-2 rounded-lg text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as User["role"])}
            className="input-dark w-full sm:w-64 px-3 py-2 rounded-lg text-sm text-white"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {role === "station_operator" && (
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Assigned Stations
            </label>
            <SearchableToggleList
              title="Stations"
              items={stations.map((s) => ({ id: s.id, label: s.name }))}
              selectedIds={stationIds}
              onToggle={toggleStation}
              searchPlaceholder="Search stations..."
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={!canSave}
            className="btn-primary px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editingUser ? "Save Changes" : "Add User"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}