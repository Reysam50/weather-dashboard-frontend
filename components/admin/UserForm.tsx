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
  { value: "station_operator", label: "Station Operator (Read/Calibrate)" },
  { value: "administrator", label: "Administrator" },
  { value: "technical_team", label: "Technical Team (Full Write)" },
];

/**
 * Add/edit user modal — matches POST /users, PATCH /users/{id}, and
 * POST /users/{id}/stations (api-specification.md §3). Station assignment
 * only appears for Station Operator: per stakeholder-analysis.md,
 * Administrator/Technical Team already see every station.
 *
 * Same modal shell pattern as ProvisionStationModal/CalibrationDrawer on
 * the Station Map screen.
 */
export default function UserForm({ stations, editingUser, onSave, onCancel }: UserFormProps) {
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close user form"
        onClick={onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg bg-card-bg border border-border-hover rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-border-line flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                {editingUser ? "manage_accounts" : "person_add"}
              </span>
              {editingUser ? "Edit Permissions" : "Add New User"}
            </h2>
            <p className="text-xs font-mono text-on-surface-variant mt-1">
              {editingUser ? editingUser.email : "Grant a new operator access to the network."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-on-surface-variant hover:text-white transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">Security Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as User["role"])}
              className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {role === "station_operator" && (
            <div>
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-2">
                Assigned Stations
              </span>
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
              className="flex-1 py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingUser ? "Save Changes" : "Add User"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-lg border border-border-line text-slate-300 hover:bg-slate-800/50 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}